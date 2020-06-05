<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ScheduleFormationDateHelper
{
    protected $startOfDay = '00:00:01';

    protected $endOfDay = '23:59:59';

    public $startOfDayForCalendarFormat = "Y-m-d 06:00:00";

    public $endOfDayForCalendarFormat = "Y-m-d 23:00:00";

    /**
     * Returns an integer from the desired format. For example, minutes, hours, days, and so on.
     *
     * @param string $format
     * @param string $date
     *
     * @return int
     */
    public function getValueFromDate(string $format, string $date): int
    {
        return intval(date($format, strtotime($date)));
    }

    /**
     * Concatenates the current date with time and leads to the desired format.
     *
     * @param $date - Date with time in 12 hour format.
     *
     * @return false|string
     */
    public function changeDateFrom12HourFormatTo24Hour($date)
    {
        return date('Y-m-d H:i:s', strtotime($date));
    }

    /**
     * Adds time frames for dates.
     *
     * @param string $startDate
     * @param string $endDate
     *
     * @return array
     */
    public function prepareTimeForRequest(string $startDate, string $endDate): array
    {
        return ["{$startDate} {$this->startOfDay}", "{$endDate} {$this->endOfDay}"];
    }

    /**
     * Forms an array of dates for a specific week.
     *
     * @param string $startPeriod
     * @param string|null $endPeriod
     *
     * @return array
     *
     * @throws Exception
     */
    function getDaysOfWeek(string $startPeriod, string $endPeriod = null): array
    {
        $dates = [];
        $startPeriod = new DateTime($startPeriod);
        if ($endPeriod) {
            $endPeriod = new DateTime($endPeriod);
            $endPeriod->modify('+1 day');
        }


        if ($endPeriod) {
            $periods = new DatePeriod($startPeriod, new DateInterval('P1D'), $endPeriod);
            foreach ($periods as $period) {
                $dayShort = strtolower($period->format('D'));
                $dates[$dayShort]['date'] = $period->format('Y-m-d');
            }
        } else {
            $dayShort = strtolower($startPeriod->format('D'));
            $dates[$dayShort]['date'] = $startPeriod->format('Y-m-d');
        }

        return $dates;
    }

    /**
     * Changes the date format to the specified.
     *
     * @param string $format
     * @param string $date
     *
     * @return false|string
     */
    public function changeDateFormat(string $format, string $date)
    {
        return date($format, strtotime($date));
    }

    /**
     * Changes the time format to the time from which the schedule begins and ends.
     *
     * @param string $timeFrom
     * @param string $timeTill
     *
     * @return array
     */
    public function reformatTimeIfSelectedAllDay(string $timeFrom, string $timeTill): array
    {
        if ($this->changeDateFormat('H:i:s', $timeFrom) === $this->startOfDay) {
            $timeFrom = $this->changeDateFormat($this->startOfDayForCalendarFormat, $timeFrom);
        }

        if ($this->changeDateFormat('H:i:s', $timeTill) === $this->endOfDay) {
            $timeTill = $this->changeDateFormat($this->endOfDayForCalendarFormat, $timeTill);
        }

        return [$timeFrom, $timeTill];
    }
    /**
     * Changes the date to the specified modify.
     *
     * @param string $time
     * @param string $modify
     * @param string $format
     *
     * @return string
     *
     * @throws Exception
     */
    public function changeDate($time, $modify, $format): string
    {
        $dateTime = new DateTime($time);
        $dateTime->modify($modify);

        return $dateTime->format($format);
    }

    public function roundUpToHour($dateString, $format, $rounding)
    {
        $date = new DateTime($dateString);
        $minutes = (int)$date->format('i');
        if ($minutes > 0) {
            if ($rounding === 'next') {
                $date->modify("+1 hour");
                $date->modify('-' . $minutes . ' minutes');
            } else {
                $date->modify("-1 hour");
                $date->modify('+' . (60 - $minutes) . ' minutes');
            }
        }

        return $date->format($format);
    }

    public function getDifferenceOfMinutesInHour($dateString, $format, $rounding)
    {
        $date = new DateTime($dateString);
        if ($rounding === 'next') {
            $date->modify("+1 hour");

            return intval(date('i', (strtotime($date->format($format)) - strtotime($dateString))));
        } else {
            $date->modify("-1 hour");

            return intval(date('i', (strtotime($dateString) - strtotime($date->format($format)))));
        }
    }

    public function validateTime($timeFrom, $timeTill, $isAvailabilityAllDay, $id = null)
    {
        $timeFrom = $this->changeDateFrom12HourFormatTo24Hour($timeFrom);
        $timeTill = $this->changeDateFrom12HourFormatTo24Hour($timeTill);

        $timeFromForCheck = $this->changeDate($timeFrom, '+1 second', 'Y-m-d H:i:s');
        $timeTillForCheck = $this->changeDate($timeTill, '-1 second', 'Y-m-d H:i:s');

        if (strtotime($timeFromForCheck) >= strtotime($timeTillForCheck)) {
            return 'Time from cannot be longer than time till equal to it.';
        }

        $freeTimeSlotQueryForAvailability = DB::table('availability_for_coaches')
            ->where(function ($query) use ($timeFromForCheck, $timeTillForCheck) {
                $query->where(function ($query) use ($timeFromForCheck) {
                    $query->where('time_from', '<=', $timeFromForCheck)
                        ->where('time_till', '>=', $timeFromForCheck);
                })->orWhere(function ($query) use ($timeTillForCheck) {
                    $query->where('time_from', '<=', $timeTillForCheck)
                        ->where('time_till', '>=', $timeTillForCheck);
                });
            })
            ->where('coach_id', '=', Auth::user()->id);

        if (!is_null($id)) {
            $freeTimeSlotQueryForAvailability->where('id', '!=', $id);
        }

        $freeTimeSlotForAvailability = $freeTimeSlotQueryForAvailability->get();

        $freeTimeSlotQueryForSessionsInStudio = DB::table('coach_studio_times')
            ->where(function ($query) use ($timeFromForCheck, $timeTillForCheck) {
                $query->where(function ($query) use ($timeFromForCheck) {
                    $query->where('coach_studio_times_start', '<=', $timeFromForCheck)
                        ->where('coach_studio_times_end', '>=', $timeFromForCheck);
                })->orWhere(function ($query) use ($timeTillForCheck) {
                    $query->where('coach_studio_times_start', '<=', $timeTillForCheck)
                        ->where('coach_studio_times_end', '>=', $timeTillForCheck);
                });
            })
            ->where('coach_id', '=', Auth::user()->id)
            ->get();

        if ($freeTimeSlotForAvailability || $freeTimeSlotQueryForSessionsInStudio) {
            $timeFromFormat = $this->changeDateFormat('n/j/Y g:i A', $timeFrom);
            $timeTillFormat = $this->changeDateFormat('n/j/Y g:i A', $timeTill);
            $periodOfTime = $isAvailabilityAllDay
                ? "You are already scheduled availability for times: 'All Day'."
                : "You are already scheduled availability for times: {$timeFromFormat} to {$timeTillFormat}.";

            return $periodOfTime . " Please adjust this availability time.";
        }

        return false;
    }
}