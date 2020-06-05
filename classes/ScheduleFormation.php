<?php

use Illuminate\Support\Facades\View;

class ScheduleFormation
{
    private $dateHelper;
    private $studiosColors = [];
    protected $pathToViews = 'users.coaches.schedule';

    /**
     * Intervals for schedule.
     *
     * @var array
     */
    public $cellsTimes = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
        '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
        '11:00 PM'];

    /**
     * Parameters for calculating the minimum height of lessons, free and available time.
     *
     * @var array
     */
    public $minHeightsForBlocks = [
        'lesson' => [
            'minHeight' => 80, 'minutesForMinHeight' => 30
        ],
        'personalOrAvailabilityTime' => [
            'minHeight' => 30, 'minutesForMinHeight' => 20,
        ],
    ];

    public function __construct(ScheduleFormationDateHelper $scheduleFormationDateHelper)
    {
        $this->dateHelper = $scheduleFormationDateHelper;
    }

    /**
     * Formation of additional parameters for each day.
     *
     * @param array $dayInfo
     *
     * @return array
     */
    public function getAdditionalOptionsForEveryDay(array $dayInfo): array
    {
        $dayInfo['cell_time'] = [
            ['time_from' => '06:00 AM', 'time_till' => '07:00 AM'],
            ['time_from' => '07:00 AM', 'time_till' => '08:00 AM'],
            ['time_from' => '08:00 AM', 'time_till' => '09:00 AM'],
            ['time_from' => '09:00 AM', 'time_till' => '10:00 AM'],
            ['time_from' => '10:00 AM', 'time_till' => '11:00 AM'],
            ['time_from' => '11:00 AM', 'time_till' => '12:00 PM'],
            ['time_from' => '12:00 PM', 'time_till' => '01:00 PM'],
            ['time_from' => '01:00 PM', 'time_till' => '02:00 PM'],
            ['time_from' => '02:00 PM', 'time_till' => '03:00 PM'],
            ['time_from' => '03:00 PM', 'time_till' => '04:00 PM'],
            ['time_from' => '04:00 PM', 'time_till' => '05:00 PM'],
            ['time_from' => '05:00 PM', 'time_till' => '06:00 PM'],
            ['time_from' => '06:00 PM', 'time_till' => '07:00 PM'],
            ['time_from' => '07:00 PM', 'time_till' => '08:00 PM'],
            ['time_from' => '08:00 PM', 'time_till' => '09:00 PM'],
            ['time_from' => '09:00 PM', 'time_till' => '10:00 PM'],
            ['time_from' => '10:00 PM', 'time_till' => '11:00 PM'],
        ];
        $dayInfo['dateInOutputFormat'] = $this->dateHelper->changeDateFormat('D, M j', $dayInfo['date']);

        return $dayInfo;
    }

    /**
     * Calculates block height based on start and end time.
     *
     * @param array $lesson
     * @param array $cellsHeight
     *
     * @return int
     */
    public function calculateBlockHeight(array $lesson, array $cellsHeight): int
    {
        $totalHeight = 0;
        foreach ($lesson['hoursWithDuration'] as $hour => $lessonHour) {
            $heightCell = $cellsHeight[$hour];
            $blockHeightInHour = $heightCell * $lessonHour['duration'] / 60;

            if ($lessonHour['duration'] <= 60 && $lessonHour['isFirst'] && $lessonHour['isLast']) {
                // subtraction 3 for a beautiful display.
                $blockHeightInHour -= 3;
            } elseif ($lessonHour['isFirst'] && !$lessonHour['isLast']) {
                // adding 2px for each new cell (2px border).
                $blockHeightInHour += 2;
            } elseif (!$lessonHour['isFirst'] && !$lessonHour['isLast']) {
                // adding 2px for each new cell (2px border).
                $blockHeightInHour += 2;
            } elseif(!$lessonHour['isFirst'] && $lessonHour['isLast']) {
                // subtraction 3 for a beautiful display.
                $blockHeightInHour -= 3;
            }

            $totalHeight += $blockHeightInHour;
        }

        return $totalHeight;
    }

    /**
     * Prepares selectors to be added to td tags.
     *
     * @param string $timeFrom
     * @param string $timeTill
     *
     * @return array
     */
    public function prepareSelectors(string $timeFrom, string $timeTill): array
    {
        $selectors = [];

        $selectors['time_from'] = $this->dateHelper->changeDateFormat('h:00 A', $timeFrom);
        $selectors['day_name'] = strtolower($this->dateHelper->changeDateFormat('D', $timeTill));

        return $selectors;
    }

    /**
     * Creates blocks (personal or availability times, sessions of coach, booking).
     *
     * @param array $timeBlocksDividedByTimeIntervals
     * @param array $cellsHeight
     * @param array $schedule
     *
     * @return array
     */
    public function createTimeBlocks(array $timeBlocksDividedByTimeIntervals, array $cellsHeight, $schedule = []): array
    {
        foreach ($timeBlocksDividedByTimeIntervals as $timeBlock) {
            if ($timeBlock['type'] === 'lesson') {
                $schedule['lessons']['lesson-' . $timeBlock['id']] = $this->createLessonBlock($timeBlock, $cellsHeight);
            } elseif ($timeBlock['type'] === 'personalOrAvailabilityTime') {
                $schedule['personalAndAvailabilityTimes']['personalOrAvailability-' . $timeBlock['id']] = $this->createPersonalOrAvailabilityTimeBlock($timeBlock, $cellsHeight);
            } else {
                $schedule['timesCoachIsInStudio']['timesCoachIsInStudio-' . $timeBlock['id']] = $this->createCoachSessionInStudioBlock($timeBlock, $cellsHeight);
            }
        }

        return $schedule;
    }

    /**
     * Creates a block with a reserved time for the coach.
     *
     * @param $time
     * @param array $cellsHeight
     * @param array $options
     *
     * @return array
     */
    public function createCoachSessionInStudioBlock($time, array $cellsHeight, $options = []): array
    {
        list($start, $finish) = $this->getStartAndEndTimes($time);

        $options['selectors'] = $this->prepareSelectors($start, $finish);
        $options['cellsThatArePartOfBlock'] = $this->getHoursThatArePartOfBlock($start, $finish);
        $blockHeightWithAdjustments = $options['heightForOutput'] = $this->calculateBlockHeight($time, $cellsHeight);
        $minutesToStart = $this->calculateIndentForBlock($time, $cellsHeight);

        $options['type'] = 'coachSessionInStudio';

        $options['html_block'] = View::make("$this->pathToViews.calendar.blocks.coach_session_in_studio",
            compact('item', 'minutesToStart', 'blockHeightWithAdjustments'))->render();

        return $options;
    }

    /**
     * Creates a block with a personal or availability time for the coach.
     *
     * @param $time
     * @param $cellsHeight
     * @param array $options
     *
     * @return array
     */
    public function createPersonalOrAvailabilityTimeBlock($time, $cellsHeight, array $options = []): array
    {
        list($start, $finish) = $this->getStartAndEndTimes($time);
        list($timeFrom, $timeTill) = $this->dateHelper->reformatTimeIfSelectedAllDay($start, $finish);

        $options['selectors'] = $this->prepareSelectors($timeFrom, $timeTill);
        $options['cellsThatArePartOfBlock'] = $this->getHoursThatArePartOfBlock($timeFrom, $timeTill);
        $blockHeightWithAdjustments = $options['heightForOutput'] = $this->calculateBlockHeight($time, $cellsHeight);
        $minutesToStart = $this->calculateIndentForBlock($time, $cellsHeight);

        $timeFrom = $this->dateHelper->changeDateFormat('h:i A', $timeFrom);
        $timeTill = $this->dateHelper->changeDateFormat('h:i A', $timeTill);

        $options['type'] = 'personalOrAvailability';
        $options['overallDuration'] = $time['overallDuration'];
        $options['id'] = $time['id'];

        $compact = compact('time', 'minutesToStart', 'blockHeightWithAdjustments', 'timeFrom', 'timeTill');
        $options['html_block'] = $time['status'] === 'personal'
            ? View::make("$this->pathToViews.calendar.blocks.personal_time_content", $compact)->render()
            : View::make("$this->pathToViews.calendar.blocks.availability_time_content", $compact)->render();

        return $options;
    }

    /**
     * Creates a block with a booking for the coach.
     *
     * @param $lesson
     * @param $cellsHeight
     * @param array $options
     *
     * @return array
     */
    public function createLessonBlock($lesson, $cellsHeight, array $options = [])
    {
        list($start, $finish) = $this->getStartAndEndTimes($lesson);
        list($timeFrom, $timeTill) = $this->dateHelper->reformatTimeIfSelectedAllDay($start, $finish);

        $options['selectors'] = $this->prepareSelectors($timeFrom, $timeTill);
        $options['cellsThatArePartOfBlock'] = $this->getHoursThatArePartOfBlock($timeFrom, $timeTill);
        $blockHeightWithAdjustments = $options['heightForOutput'] = $this->calculateBlockHeight($lesson, $cellsHeight);
        $minutesToStart = $this->calculateIndentForBlock($lesson, $cellsHeight);

        $timeFrom = $this->dateHelper->changeDateFormat('h:i A', $timeFrom);
        $timeTill = $this->dateHelper->changeDateFormat('h:i A', $timeTill);

        if (!isset($this->studiosColors[$lesson['studio_id']])) {
            $this->studiosColors[$lesson['studio_id']] = sprintf('#%02X%02X%02X', rand(0, 255), rand(0, 255), rand(0, 255));
        }

        $studioColor = $this->studiosColors[$lesson['studio_id']];
        $options['type'] = 'lesson';
        $options['overallDuration'] = $lesson['overallDuration'];
        $options['id'] = $lesson['id'];

        $options['html_block'] = View::make("$this->pathToViews.calendar.blocks.coach_lessons_content",
            compact('lesson', 'minutesToStart', 'blockHeightWithAdjustments', 'timeFrom', 'timeTill', 'studioColor'))->render();

        return $options;
    }

    /**
     * Forms a list of hours through which the block passes.
     *
     * @param string $timeFrom
     * @param string $timeTill
     * @param array $hours
     *
     * @return array
     */
    public function getHoursThatArePartOfBlock(string $timeFrom, string $timeTill, array $hours = []): array
    {
        $hours[] = $this->dateHelper->changeDateFormat('h:00 A', $timeFrom);

        $hoursToStart = $this->dateHelper->getValueFromDate('H', $timeFrom);
        $hoursToFinish = $this->dateHelper->getValueFromDate('H', $timeTill);
        $minutesToFinish = $this->dateHelper->getValueFromDate('i', $timeTill);

        if ($minutesToFinish === 0) {
            $hoursToFinish -= 1;
        }

        $time = $timeFrom;
        for ($i = $hoursToStart; $i < $hoursToFinish; $i++) {
            $timeStartBlock = date_create($time);
            date_modify($timeStartBlock, "+1 hour");
            $time = date_format($timeStartBlock, 'h:00 A');
            $hours[] = $time;
        }

        return $hours;
    }

    /**
     * Interlayer for calling the clock methods.
     *
     * @param $lessons
     * @param $personalAndAvailabilityTimes
     * @param $timesCoachIsInStudio
     *
     * @return array
     */
    public function beatTimeBlocks($lessons, $personalAndAvailabilityTimes, $timesCoachIsInStudio): array
    {
        $timeBlocksDividedByTimeIntervals = [];

        foreach ($lessons as $lesson) {
            $timeBlocksDividedByTimeIntervals[] = $this->beatByHourLesson($lesson);
        }

        foreach ($personalAndAvailabilityTimes as $time) {
            $timeBlocksDividedByTimeIntervals[] = $this->beatByHourPersonalOrAvailabilityTime($time);
        }

        foreach ($timesCoachIsInStudio as $time) {
            $timeBlocksDividedByTimeIntervals[] = $this->beatByHourCoachStudioTimes($time);
        }

        return $timeBlocksDividedByTimeIntervals;
    }

    /**
     * Splits the time interval of the lesson by the hour.
     *
     * @param $lesson
     *
     * @return array
     */
    public function beatByHourLesson($lesson)
    {
        $timeFrom = $lesson->book_schedule_lesson_start;
        $timeTill = $lesson->book_schedule_lesson_end;

        $overallDuration = $this->calculateOverallDuration($timeFrom, $timeTill);
        $hoursThatArePartOfBlock = $this->getHoursThatArePartOfBlock($timeFrom, $timeTill);
        $hoursWithDuration = $this->calculateDurationForEachHour($hoursThatArePartOfBlock, $overallDuration, $timeFrom, $timeTill);

        return [
            'hoursWithDuration' => $hoursWithDuration,
            'day'               => strtolower($this->dateHelper->changeDateFormat('D', $timeFrom)),
            'start'             => $timeFrom,
            'end'               => $timeTill,
            'type'              => 'lesson',
            'overallDuration'   => $overallDuration,
            'studio_name'       => $lesson->studio_name,
            'state_abbr'        => $lesson->state_abbr,
            'data_name'         => $lesson->data_name,
            'fname'             => $lesson->fname,
            'lname'             => $lesson->lname,
            'studio_id'         => $lesson->studio_id,
            'students'          => $lesson->students,
            'lesson_id'         => $lesson->id,
            'id'                => $lesson->id,
            'additional_param'  => $lesson->additional_param,
        ];
    }

    /**
     * Splits the time interval of the personal or availability times by the hour.
     *
     * @param $time
     *
     * @return array
     */
    public function beatByHourPersonalOrAvailabilityTime($time)
    {
        $timeFrom = $time['time_from'];
        $timeTill = $time['time_till'];

        $overallDuration = $this->calculateOverallDuration($timeFrom, $timeTill);
        $hoursThatArePartOfBlock = $this->getHoursThatArePartOfBlock($timeFrom, $timeTill);
        $hoursWithDuration = $this->calculateDurationForEachHour($hoursThatArePartOfBlock, $overallDuration, $timeFrom, $timeTill);

        return [
            'hoursWithDuration' => $hoursWithDuration,
            'day'               => strtolower($this->dateHelper->changeDateFormat('D', $timeFrom)),
            'start'             => $timeFrom,
            'end'               => $timeTill,
            'type'              => 'personalOrAvailabilityTime',
            'overallDuration'   => $overallDuration,
            'event_name'        => $time['event_name'],
            'notes'             => $time['notes'],
            'status'            => $time['status'],
            'id'                => $time['id'],
        ];
    }

    /**
     * Splits the time interval of the coach in studio time by the hour.
     *
     * @param $time
     *
     * @return array
     */
    public function beatByHourCoachStudioTimes($time)
    {
        $timeFrom = $time->coach_studio_times_start;
        $timeTill = $time->coach_studio_times_end;

        $overallDuration = $this->calculateOverallDuration($timeFrom, $timeTill);
        $hoursThatArePartOfBlock = $this->getHoursThatArePartOfBlock($timeFrom, $timeTill);
        $hoursWithDuration = $this->calculateDurationForEachHour($hoursThatArePartOfBlock, $overallDuration, $timeFrom, $timeTill);

        return [
            'hoursWithDuration' => $hoursWithDuration,
            'day'               => strtolower($this->dateHelper->changeDateFormat('D', $timeFrom)),
            'start'             => $timeFrom,
            'end'               => $timeTill,
            'type'              => 'coachStudioTimes',
            'overallDuration'   => $overallDuration,
            'id'                => $time->id,
        ];
    }

    /**
     * Calculates the indent of the block based on the height of the cell.
     *
     * @param $lesson
     * @param $cellsHeight
     *
     * @return int
     */
    public function calculateIndentForBlock($lesson, $cellsHeight): int
    {
        $minutes = $this->dateHelper->getDifferenceOfMinutesInHour($lesson['start'], 'i', 'last');

        if (!$minutes) {
            return 0;
        } else {
            $hour = $this->dateHelper->changeDateFormat('h:00 A', $lesson['start']);
            $heightCell = $cellsHeight[$hour];

            return intval($heightCell * $minutes / 60);
        }
    }

    /**
     * Calculates the length of time in minutes.
     *
     * @param $timeFrom
     * @param $timeTill
     *
     * @return int
     */
    public function calculateOverallDuration($timeFrom, $timeTill)
    {
        $minutesToStart = $this->dateHelper->getValueFromDate('i', $timeFrom);
        $hoursToStart = $this->dateHelper->getValueFromDate('H', $timeFrom);
        $minutesToFinish = $this->dateHelper->getValueFromDate('i', $timeTill);
        $hoursToFinish = $this->dateHelper->getValueFromDate('H', $timeTill);

        $startTimestamp = $hoursToStart * 60 + $minutesToStart;
        $finishTimestamp = $hoursToFinish * 60 + $minutesToFinish;

        return $finishTimestamp - $startTimestamp;
    }

    /**
     * Calculates the duration of the time period for each hour
     * (the block is already divided into intervals equal to an hour) in minutes.
     *
     * @param array $hoursThatArePartOfBlock
     * @param $overallDuration
     * @param $timeFrom
     * @param $timeTill
     *
     * @return array
     */
    public function calculateDurationForEachHour(array $hoursThatArePartOfBlock, $overallDuration, $timeFrom, $timeTill): array
    {
        $i = 0;
        $hours = [];
        foreach ($hoursThatArePartOfBlock as $hour) {
            if (count($hoursThatArePartOfBlock) === 1 && $overallDuration <= 60) {
                $isFirst = true;
                $isLast = true;
                $minutesInHour = $overallDuration;
            } else {
                if ($i === 0) {
                    $minutesInHour = intval($this->dateHelper->getDifferenceOfMinutesInHour($timeFrom, 'i', 'next'));
                    $isFirst = true;
                    $isLast = false;
                } elseif ($i !== count($hoursThatArePartOfBlock) - 1) {
                    $minutesInHour = 60;
                    $isFirst = false;
                    $isLast = false;
                } else {
                    $minutesInHour = intval($this->dateHelper->getDifferenceOfMinutesInHour($timeTill, 'i', 'last'));
                    $isFirst = false;
                    $isLast = true;
                }
            }

            $hours[$hour] = [
                'duration' => boolval($minutesInHour) ? $minutesInHour : 60,
                'isFirst' => $isFirst,
                'isLast' => $isLast,
            ];
            ++$i;
        }

        return $hours;
    }

    /**
     * Calculates the minimum time interval for each hour,
     * not taking into account the time when the coach is in the studio.
     *
     * @param array $timeBlocksDividedByTimeIntervals
     *
     * @return array
     */
    public function calculateMinimumTimeIntervalsForOneHour(array $timeBlocksDividedByTimeIntervals): array
    {
        $minTimeIntervalsForOneHour = [];
        foreach ($timeBlocksDividedByTimeIntervals as $blockHeightByHours) {
            if ($blockHeightByHours['type'] === 'coachStudioTimes') {
                // Minimum height calculation does not include when the coach is in the studio.
                continue;
            }

            foreach ($blockHeightByHours['hoursWithDuration'] as $time => $info) {
                $info['type'] = $blockHeightByHours['type'];

                if (isset($minTimeIntervalsForOneHour[$time])) {
                    $minDurationInHour = $minTimeIntervalsForOneHour[$time]['duration'];
                    if ($info['duration'] < $minDurationInHour) {
                        $minTimeIntervalsForOneHour[$time] = $info;
                    }
                } else {
                    $minTimeIntervalsForOneHour[$time] = $info;
                }
            }
        }

        return $minTimeIntervalsForOneHour;
    }

    /**
     * Calculates the height of each row from the minimum gaps.
     *
     * @return array
     */
    public function calculateCellsHeight(): array
    {
        $cellsHeight = [];

        foreach ($this->cellsTimes as $time) {
                $cellsHeight[$time] = 90;
        }

        return $cellsHeight;
    }

    /**
     * Returns the start and end date for a time block.
     *
     * @param $time
     *
     * @return array
     */
    public function getStartAndEndTimes($time): array
    {
        return [$time['start'], $time['end']];
    }
}