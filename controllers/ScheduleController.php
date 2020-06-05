<?php

use Eluceo\iCal\Component\Calendar;
use Eluceo\iCal\Component\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Input;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\View;

class ScheduleController extends BaseController
{
    private $scheduleFormation;
    private $dateH;
    protected $pathToViews = 'users.coaches.schedule.calendar';

    public function __construct(ScheduleFormation $scheduleFormation, ScheduleFormationDateHelper $scheduleFormationDateH)
    {
        $this->scheduleFormation = $scheduleFormation;
        $this->dateH = $scheduleFormationDateH;
    }

    public function index()
    {
        /* -- Write to the session so that the main class is container-fluid. -- */
        Session::put('is_booking_calendar', 'yes');
        $actionSelection = $this->getActionSelectionContent();
        $currentDay = date('D, F j, Y');

        return Response::view("$this->pathToViews.views.coach_schedule", compact('currentDay', 'actionSelection'));
    }

    public function create()
    {
        $timeTill = Input::get('timeTill');
        $timeFrom = Input::get('timeFrom');
        $action = Input::get('action');
        $dateOfSelectedDay = Input::get('dateOfSelectedDay');

        if ($action === 'availability') {
            return View::make("$this->pathToViews.blocks.actions.add_availability_time",
                compact('timeFrom', 'timeTill', 'dateOfSelectedDay'));
        } else {
            return View::make("$this->pathToViews.blocks.actions.add_personal_time",
                compact('timeFrom', 'timeTill', 'dateOfSelectedDay'));
        }
    }

    public function store(): JsonResponse
    {
        $timeFromInput = Input::get('timeFrom');
        $timeTillInput = Input::get('timeTill');

        if (Input::get('available_all_day')) {
            $selectedDay = Input::get('selected_day');
            $timeFrom = $this->dateH->changeDateFormat($this->dateH->startOfDayForCalendarFormat, $selectedDay);
            $timeTill = $this->dateH->changeDateFormat($this->dateH->endOfDayForCalendarFormat, $selectedDay);
        } else {
            $timeFrom = $this->dateH->changeDateFrom12HourFormatTo24Hour($timeFromInput);
            $timeTill = $this->dateH->changeDateFrom12HourFormatTo24Hour($timeTillInput);
        }

        $validatePersonalTimeError = $this->dateH->validateTime($timeFrom, $timeTill, Input::get('available_all_day'));
        if ($validatePersonalTimeError) {
            return Response::json(['status' => 'error', 'error' => $validatePersonalTimeError]);
        }

        $data = [
            'coach_id'      => Auth::user()->id,
            'status'        => Input::get('status') === 'personal' ? 'personal' : 'availability',
            'event_name'    => Input::get('eventName') ?: null,
            'notes'         => Input::get('notes') ?: null,
            'time_from'     => $timeFrom,
            'time_till'     => $timeTill,
        ];
        $id = AvailabilityForCoaches::create($data)->id;

        return Response::json(['status' => 'OK', 'error' => false, 'id' => $id]);
    }

    public function edit(int $id)
    {
        $time = AvailabilityForCoaches::find($id);
        $result = $time->status === 'availability' ? $this->editAvailability($time) : $this->editPersonal($time);

        return Response::json($result);
    }

    public function editPersonal($personalTime)
    {
        $allDay = false;
        $dateOfSelectedDay = $this->dateH->changeDateFormat('Y-m-d', $personalTime->time_from);

        $personalTime->time_from = $this->dateH->changeDateFormat('h:i A', $personalTime->time_from);
        $personalTime->time_till = $this->dateH->changeDateFormat('h:i A', $personalTime->time_till);

        $editModal =  View::make("$this->pathToViews.blocks.actions.edit_personal_time",
            compact('personalTime', 'allDay', 'dateOfSelectedDay'))->render();

        return ['status' => 'OK', 'error' => false, 'editModal' => $editModal];
    }

    public function editAvailability($availability)
    {
        $pending = DB::table('coach_studio_times')
            ->where(function ($query) use ($availability) {
                $query->whereBetween('coach_studio_times_start', [$availability->time_from, $availability->time_till])
                    ->orWhereBetween('coach_studio_times_end', [$availability->time_from, $availability->time_till]);
            })
            ->where('coach_id', '=', Auth::user()->id)
            ->where('status_invitation', '=', 0)
            ->get();

        if ($pending) {
            return ['status' => 'error', 'error' => 'For the selected period there is an invitation.'];
        }

        $allDay = false;
        $dateOfSelectedDay = $this->dateH->changeDateFormat('Y-m-d', $availability->time_from);
        $timeFromFormat = $this->dateH->changeDateFormat('H:i:s', $availability->time_from);
        $timeTillFormat = $this->dateH->changeDateFormat('H:i:s', $availability->time_till);

        if ($timeFromFormat === '06:00:00' && $timeTillFormat === '23:00:00') {
            $allDay = true;
        } else {
            $availability->time_from = $this->dateH->changeDateFormat('h:i A', $availability->time_from);
            $availability->time_till = $this->dateH->changeDateFormat('h:i A', $availability->time_till);
        }

        $editModal = View::make("$this->pathToViews.blocks.actions.edit_availability_time",
            compact('availability', 'allDay', 'dateOfSelectedDay'))->render();

        return ['status' => 'OK', 'error' => false, 'editModal' => $editModal];
    }

    public function update(int $id)
    {
        return Response::json($this->updatePersonalOrAvailability($id, Input::get('status')));
    }

    public function updatePersonalOrAvailability($id, $type)
    {
        $timeFromInput = Input::get('timeFrom');
        $timeTillInput = Input::get('timeTill');

        if (Input::get('available_all_day')) {
            $selectedDay = Input::get('selected_day');
            $timeFrom = $this->dateH->changeDateFormat($this->dateH->startOfDayForCalendarFormat, $selectedDay);
            $timeTill = $this->dateH->changeDateFormat($this->dateH->endOfDayForCalendarFormat, $selectedDay);
        } else {
            $timeFrom = $this->dateH->changeDateFrom12HourFormatTo24Hour($timeFromInput);
            $timeTill = $this->dateH->changeDateFrom12HourFormatTo24Hour($timeTillInput);
        }

        $validatePersonalTimeError = $this->dateH->validateTime($timeFrom, $timeTill, Input::get('available_all_day'), $id);
        if ($validatePersonalTimeError) {
            return ['status' => 'error', 'error' => $validatePersonalTimeError];
        }

        $newData = ['time_from' => $timeFrom, 'time_till' => $timeTill];
        if ($type === 'personal') {
            $newData['event_name'] = Input::get('eventName');
            $newData['notes'] = Input::get('notes');
        }

        AvailabilityForCoaches::where('id', $id)->update($newData);

        return ['status' => 'OK', 'error' => false, 'type' => $type];
    }

    public function destroy(int $id)
    {
        AvailabilityForCoaches::destroy($id);

        return Response::json(['status' => 'OK', 'error' => false ]);
    }

    public function getSchedule($schedule = []): JsonResponse
    {
        $between = Input::get('betweenPeriods');
        $view = Input::get('view');

        list($weekMondayTime, $weekSundayTime) = $this->dateH->prepareTimeForRequest($between['start'], $between['end']);

        $lessons = $this->getLessons($weekMondayTime, $weekSundayTime, Auth::user()->id);
        $personalAndAvailabilityTimes = $this->getPersonalAndAvailabilityTimes($weekMondayTime, $weekSundayTime);
        $timesCoachIsInStudio = $this->getCoachSessions($weekMondayTime, $weekSundayTime);

        $timeBlocksDividedByTimeIntervals = $this->scheduleFormation->beatTimeBlocks($lessons, $personalAndAvailabilityTimes, $timesCoachIsInStudio);

        $cellsHeight = $this->scheduleFormation->calculateCellsHeight();

        $schedule = $this->scheduleFormation->createTimeBlocks($timeBlocksDividedByTimeIntervals, $cellsHeight);

        $scheduleDisplay = $this->getScheduleDisplay($view);

        return Response::json(compact('schedule', 'cellsHeight', 'scheduleDisplay'));
    }

    public function getActionSelectionContent()
    {
        return View::make("$this->pathToViews.modals.action_selection")->render();
    }

    public function getSetAvailabilityContent()
    {
        return View::make("$this->pathToViews.modals.set_availability")->render();
    }

    public function getPersonalAndAvailabilityTimes(string $weekMondayTime, string $weekSundayTime)
    {
        $personalAndAvailabilityTimeQuery = Auth::user()
            ->availabilityForCoaches()
            ->whereBetween('time_from', [$weekMondayTime, $weekSundayTime])
            ->select(['id', 'status', 'time_from', 'time_till', 'event_name', 'notes']);

        return $personalAndAvailabilityTimeQuery->get()->toArray();
    }

    public function getPersonalTimesForICS(string $weekMondayTime, string $weekSundayTime, $coachId)
    {
        return DB::table('availability_for_coaches')
            ->whereBetween('time_from', [$weekMondayTime, $weekSundayTime])
            ->where('coach_id', '=', $coachId)
            ->where('status', 'personal')
            ->select(['id', 'status', 'time_from', 'time_till', 'event_name', 'notes'])
            ->get();
    }

    public function getCoachSessions($weekMondayTime, $weekSundayTime)
    {
        return DB::table('coach_studio_times')
            ->whereBetween('coach_studio_times_start', [$weekMondayTime, $weekSundayTime])
            ->where('coach_id', '=', Auth::user()->id)
            ->where('status_invitation', '=', 1)
            ->get();
    }

    public function getCoachSessionsForICS($weekMondayTime, $weekSundayTime, $coachId)
    {
        return DB::table('coach_studio_times as times')
            ->whereBetween('coach_studio_times_start', [$weekMondayTime, $weekSundayTime])
            ->join('studios', 'times.studio_id', '=', 'studios.id')
            ->join('states', 'studios.studio_state', '=', 'states.id')
            ->where('times.coach_id', '=', $coachId)
            ->where('times.status_invitation', '=', 1)
            ->select(['times.coach_studio_times_start', 'times.coach_studio_times_end',
                'studio_name', 'address_line_1', 'address_line_2',
                'studios.province', 'studios.postal_code', 'states.state_name'])
            ->get();
    }

    public function getLessons($weekMondayTime, $weekSundayTime, $coachId)
    {
        return DB::table('bookings_lessons as bl')
            ->leftJoin('bookings_students as bs', 'bs.lesson', '=', 'bl.id')
            ->leftJoin('users as students', 'bs.book_student', '=', 'students.id')
            ->join('bookings as b', 'bl.booking', '=', 'b.id')
            ->join('studios', 'b.book_schedule_studio_id', '=', 'studios.id')
            ->join('data', 'bl.book_schedule_item_type', '=', 'data.id')
            ->join('bookings_instructors as bi', 'bl.id', '=', 'bi.lesson')
            ->leftJoin('data as additional_param', 'bl.additional_param_for_coaching_id', '=', 'additional_param.id')
            ->leftJoin('states', 'studios.studio_state', '=', 'states.id')
            ->where('bi.book_instructor_not_teaching', '=', 0)
            ->where('bi.book_earned_income_instructor', '=', 0)
            ->where('bi.book_instructor', '=', $coachId)
            ->whereBetween('bl.book_schedule_lesson_start', [$weekMondayTime, $weekSundayTime])
            ->select(['bl.book_schedule_lesson_start', 'bl.book_schedule_lesson_end', 'studios.studio_name', 'bl.id',
                'data.data_name', 'students.fname', 'students.lname', 'studios.id as studio_id', 'states.state_abbr',
                DB::raw('GROUP_CONCAT(DISTINCT CONCAT(students.fname, " ", students.lname) SEPARATOR "@@") AS students'),
                'additional_param.data_name as additional_param', 'studios.studio_name', 'studios.address_line_1',
                'studios.address_line_2', 'studios.province', 'studios.postal_code', 'states.state_name'])
            ->groupBy('bl.id')
            ->get();
    }

    public function getStudioInfo($id)
    {
        $studioInfo = DB::table('staff_studio_relations')
            ->join('studios', 'staff_studio_relations.studio_id', '=', 'studios.id')
            ->join('users', 'staff_studio_relations.user_id', '=', 'users.id')
            ->join('states', 'studios.studio_state', '=', 'states.id')
            ->where('staff_studio_relations.studio_id', '=', $id)
            ->where('staff_studio_relations.is_dephead', '=', 1)
            ->select(['studio_name', 'states.state_abbr', 'address_line_1', 'address_line_2', 'primary_phone',
                'email_address', 'users.fname', 'users.lname', 'studios.province', 'studios.postal_code',
                'studios.studio_city', 'states.state_name'])->first();

        return View::make("$this->pathToViews.modals.studio_info", compact('studioInfo'));
    }

    public function getLessonInfo($id)
    {
        $color = Input::get('color');
        $lesson = BookingLessons::with(['data', 'bookingStudents', 'bookingInstructors' => function ($query) {
            $query->where('book_instructor_not_teaching', 0)
                ->where('book_earned_income_instructor', 0);
        }])
            ->findOrFail((int)$id);

        $coach = User::find($lesson->bookingInstructors->book_instructor);
        $coachAvatar = Helpers::get_gravatar($coach, 90);
        $students = $lesson->bookingStudents;
        $studentAvatars = [];

        foreach ($students as $student) {
            $studentAvatars[] = Helpers::get_gravatar($student->user, 90);
        }

        return View::make("$this->pathToViews.modals.lesson-info-modal",
            compact('lesson', 'color', 'coach', 'coachAvatar', 'students', 'studentAvatars'));
    }

    public function setBookScheduleNote()
    {
        $lessonId = Input::get('lessonId');
        $lessonNotes = Input::get('lessonNotes');

        $lesson = BookingLessons::findOrFail($lessonId);

        if ($lesson) {
            $lesson->book_schedule_note = $lessonNotes ? $lessonNotes : '';
            $lesson->save();
        }

        return View::make("$this->pathToViews.modals.lesson-notes", compact('lessonId', 'lessonNotes'));
    }

    public function getEditNotesLessonForm()
    {
        $lessonId = Input::get('lessonId');
        $lessonNotes = Input::get('lessonNotes');

        return View::make("$this->pathToViews.modals.lesson-notes-edit-form", compact('lessonId','lessonNotes'));
    }

    public function getScheduleDisplay($display)
    {
        $between = Input::get('betweenPeriods');

        $cellTimes = $this->scheduleFormation->cellsTimes;

        if ($display === 'day') {
            $dayOfWeek = $this->dateH->getDaysOfWeek($between['start']);
            foreach ($dayOfWeek as $shortName => $dayInfo) {
                $dayOfWeek[$shortName] = $this->scheduleFormation->getAdditionalOptionsForEveryDay($dayInfo);
            }

            return View::make("$this->pathToViews.views.day_schedule",
                compact('dayOfWeek', 'cellTimes'))->render();
        } else if ($display === 'week') {
            $daysOfWeek = $this->dateH->getDaysOfWeek($between['start'], $between['end']);
            foreach ($daysOfWeek as $shortName => $dayInfo) {
                $daysOfWeek[$shortName] = $this->scheduleFormation->getAdditionalOptionsForEveryDay($dayInfo);
            }

            return View::make("$this->pathToViews.views.week_schedule",
                compact('daysOfWeek', 'cellTimes'))->render();
        } else if ($display === 'month') {
            return $this->getMonthDisplay();
            // todo call method for displaying of month
        }
    }

    /**
     * Generates an ics file for google calendar
     * with different coach times (personal time, lessons, sessions in the studio).
     *
     * @param $token
     *
     * @return string
     *
     * @throws Exception
     */
    public function ics($token)
    {
        $data = CoachTokensToICSFiles::where('token', '=', $token)->first(['coach_id']);
        if (!$data) {
            return Response::json(['status' => 'error', 'error' => 'Error!']);
        }

        $vCalendar = new Calendar('');

        $timeFrom = (new DateTime())->modify('-1 month')->format('Y-m-d');
        $timeTill = (new DateTime())->modify('+12 months')->format('Y-m-d');

        list($timeFromForRequest, $timeTillForRequest) = $this->dateH->prepareTimeForRequest($timeFrom, $timeTill);

        $personalTimes = $this->getPersonalTimesForICS($timeFromForRequest, $timeTillForRequest, $data->coach_id);

        foreach ($personalTimes as $personalTime) {
            $dtStart = new DateTime($personalTime->time_from);
            $dtEnd = new DateTime($personalTime->time_till);
            $summary = "Personal - " . $personalTime->event_name ?: 'no name';
            $description = $personalTime->notes ?: '';

            $vEvent = $this->setEventForICS($dtStart, $dtEnd, $summary, $description);
            $vCalendar->addComponent($vEvent);
        }

        $coachSessions = $this->getCoachSessionsForICS($timeFromForRequest, $timeTillForRequest, $data->coach_id);
        foreach ($coachSessions as $coachSession) {
            $dtStart = new DateTime($coachSession->coach_studio_times_start);
            $dtEnd = new DateTime($coachSession->coach_studio_times_end);
            $summary = "{$coachSession->studio_name} Studio";
            $description = "Accepted Invitation for {$coachSession->studio_name}";

            $location = $this->getLocationForStudio($coachSession->address_line_1, $coachSession->address_line_2,
                $coachSession->state_name, $coachSession->province, $coachSession->postal_code);

            $vEvent = $this->setEventForICS($dtStart, $dtEnd, $summary, $description, $location);
            $vCalendar->addComponent($vEvent);
        }

        $lessons = $this->getLessons($timeFromForRequest, $timeTillForRequest, $data->coach_id);
        foreach ($lessons as $lesson) {
            $dtStart = new DateTime($lesson->book_schedule_lesson_start);
            $dtEnd = new DateTime($lesson->book_schedule_lesson_end);

            $summary = $lesson->fname && $lesson->lname ? "{$lesson->fname} {$lesson->lname} - " : "{$lesson->studio_name} - ";
            $summary .= $lesson->additional_param ? "{$lesson->additional_param}" : "{$lesson->data_name}";

            $description = "Accepted Invitation for {$lesson->studio_name}";

            $location = $this->getLocationForStudio($lesson->address_line_1, $lesson->address_line_2,
                $lesson->state_name, $lesson->province, $lesson->postal_code);

            $vEvent = $this->setEventForICS($dtStart, $dtEnd, $summary, $description, $location);
            $vCalendar->addComponent($vEvent);
        }

        header('Content-Type: text/calendar; charset=utf-8');
        header('Content-Disposition: attachment; filename="cal.ics"');

        echo $vCalendar->render();
    }

    /**
     * Collects event data for google calendar.
     *
     * @param $dtStart
     * @param $dtEnd
     * @param $summary
     * @param $description
     * @param string $location
     * @param bool $noTime
     * @param bool $useUtc
     *
     * @return Event
     */
    public function setEventForICS($dtStart, $dtEnd, $summary, $description, $location = '', $noTime = false, $useUtc = false)
    {
        return (new Event())->setDtStart($dtStart)
            ->setDtEnd($dtEnd)
            ->setSummary($summary)
            ->setDescription($description)
            ->setLocation($location)
            ->setNoTime($noTime)
            ->setUseUtc($useUtc)
            ->setUseTimezone(true);
    }

    /**
     * Forms the address for the studio.
     *
     * @param $address1
     * @param $address2
     * @param $stateName
     * @param $province
     * @param $postalCode
     *
     * @return string
     */
    public function getLocationForStudio($address1, $address2, $stateName, $province, $postalCode)
    {
        $location = '';
        if ($address1) $location .= "{$address1}, ";
        if ($address2) $location .= "{$address2}, ";
        $location .= $stateName ? "{$stateName} " : "{$province} ";
        if ($postalCode) $location .= "{$postalCode}";

        return $location;
    }

    /**
     * Generates a token for a link to receive an ics file, if there is already a token returns it.
     *
     * @return JsonResponse
     *
     * @throws Exception
     */
    public function generateTokenToGetICSFile()
    {
        $coachId = Auth::user()->id;
        $data = CoachTokensToICSFiles::where('coach_id', '=', $coachId)->first();

        if (!$data) {
            $token = $this->generateToken('token for exporting a coach schedule ' . date('Y-m-d H:i:s A'));
            $this->saveNewToken($coachId, $token);

            return Response::json(['token' => $token]);
        }

        return Response::json(['token' => $data->token]);
    }

    /**
     * Saves a new token for the coach.
     *
     * @param $coachId
     * @param $token
     */
    public function saveNewToken($coachId, $token)
    {
        $token = $this->generateToken('token for exporting a coach schedule ' . date('Y-m-d H:i:s A'));
        CoachTokensToICSFiles::create(['coach_id' => $coachId, 'token' => $token]);
    }

    /**
     * Generates a sha-256 token.
     *
     * @param $text
     *
     * @return string
     */
    public function generateToken($text)
    {
        return base64_encode(hash("sha256", $text));
    }
}
