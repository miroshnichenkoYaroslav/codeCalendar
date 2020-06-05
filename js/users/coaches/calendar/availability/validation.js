/**
 * Checks the data to create a new group of days, checks the selected days, time type and time period(s).
 *
 * @returns {boolean|ErrorValidation}
 */
function validateNewGroupDays() {
    if (!isSelectedDays()) {
        return new ErrorValidation(ErrorValidation.isNotSelectedDays);
    }

    if (!isNotSelectedTime()) {
        return new ErrorValidation('isNotSelectedTime');
    }

    if (!$(`${allDayInput}:checked`).val()) {
        const result = checkTimeFilters();
        if (result.isError) {
            return new ErrorValidation(result.typeOfError, result.params);
        }
    }

    if (!isSelectedTypeOfTime()) {
        return new ErrorValidation(ErrorValidation.isNotSelectedTypeOfTime);
    }

    if (dailyAvailabilityGroups.length >= 1) {
        const result = selectedPeriodsAreUniqueAmongAllGroups();
        if (result.isError) {
            return new ErrorValidation(result.typeOfError, result.params);
        }
    }

    return false;
}

/**
 * Check for at least one day or not.
 *
 * @returns {boolean}
 */
function isSelectedDays() {
    return !!$(selectedDayClass).size();
}

/**
 * Check on the choice of the All Day parameter or the time interval(s).
 *
 * @returns {boolean}
 */
function isNotSelectedTime() {
    let noTimeFiltersSelected = false;

    $.each($(timeFiltersClass), function (index, value) {
        const timeFiltersNumber = $(value).data('number');

        const startInputValue = getInputStartTimeFilter(timeFiltersNumber).val();
        const endInputValue = getInputEndTimeFilter(timeFiltersNumber).val();

        noTimeFiltersSelected = startInputValue || endInputValue;

        if (noTimeFiltersSelected) { return false; }
    });

    return !!$(`${allDayInput}:checked`).val() || noTimeFiltersSelected;
}

/**
 * Checks every time period.
 *
 * @returns {{isError: boolean}}
 */
function checkTimeFilters() {
    let result = { isError: false };
    const timeFilters = $(timeFiltersClass);
    let periods = {};

    _.each(timeFilters, function (value) {
        const timeFiltersNumber = $(value).data('number');

        const timeStartBlock = getInputStartTimeFilter(timeFiltersNumber);
        if (!inputIsNotEmpty(timeStartBlock)) {
            result.isError = true;
            result.typeOfError = ErrorValidation.inputIsEmpty;
            result.params = { element: timeStartBlock };

            return false;
        }

        const timeEndBlock = getInputEndTimeFilter(timeFiltersNumber);
        if (!inputIsNotEmpty(timeEndBlock)) {
            result.isError = true;
            result.typeOfError = ErrorValidation.inputIsEmpty;
            result.params = { element: timeEndBlock };

            return false;
        }

        const timeStart = $(timeStartBlock).val();
        const timeEnd = $(timeEndBlock).val();

        if (!startDateIsLessThanEndDate(timeStart, timeEnd)) {
            result.isError = true;
            result.typeOfError = ErrorValidation.startDateIsNotLessThanEndDate;
            result.params = { elements: {timeStartBlock, timeEndBlock} };

            return false;
        }

        periods[timeFiltersNumber] = {timeStart, timeEnd};

        if (timeFilters.size() > 1) {
                const timeFiltersNumber = $(value).data('number');
                const timeStartBlock = getInputStartTimeFilter(timeFiltersNumber);
                const timeEndBlock = getInputEndTimeFilter(timeFiltersNumber);

                const resultOfChecking = isPeriodTimeUnique(timeStartBlock, timeEndBlock, periods, '()');
                if (resultOfChecking.isError) {
                    result.isError = true;
                    result.typeOfError = ErrorValidation.isNotPeriodTimeUnique;
                    result.params = resultOfChecking.params;

                    return false;
                }
        }
    });

    return result;
}

/**
 * Check for empty field.
 */
function inputIsNotEmpty (element) {
    return !!$(element).val();
}

/**
 * Compares the start time with the time end, if the start time is longer, it returns an error.
 *
 * @param start - Time start of period.
 * @param end - Time end of period.
 *
 * @returns {boolean|*}
 */
function startDateIsLessThanEndDate(start, end) {
    const now = moment().format(formatDay);

    const startTime = moment(`${now} ${start}`, format12Hour);
    const endTime = moment(`${now} ${end}`, format12Hour);

    return startTime.isBefore(endTime);
}

/**
 * Check on the choice of the parameter of the type of time(personal/available).
 *
 * @returns {boolean}
 */
function isSelectedTypeOfTime() {
    return !!$(`${typeOfTimeInput}:checked`).val();
}

/**
 * Checks for uniqueness of periods for all groups.
 *
 * @returns {{isError: boolean}}
 */
function selectedPeriodsAreUniqueAmongAllGroups() {
    const allDay = $(`${allDayInput}:checked`).val();
    const periods = getPeriods();

    let result = {
        isError: false,
    };

    _.each(dailyAvailabilityGroups, function (group) {
        _.each(selectedDays, function (day) {
            if (group.selectedDays.includes(day)) {
                if (allDay) {
                    result = {};
                    result.isError = true;
                    result.typeOfError = ErrorValidation.isNotPeriodTimeUniqueAmountAllGroups;
                    result.params = { element: $(allDayInput) };

                    return false;
                }

                _.each(periods, function (period, index) {
                    let groupPeriods = [];
                    let samplingLimits = '()';
                    if (group.allDay) {
                        let samplingLimits = '[]';
                        groupPeriods[0] = { timeStart: '06:00 AM', timeEnd: '11:00 PM' };
                    } else {
                        groupPeriods = group.periods;
                    }

                    const timeStartBlock = getInputStartTimeFilter(index);
                    const timeEndBlock = getInputEndTimeFilter(index);

                    const resultOfChecking = isPeriodTimeUniqueAmountAllGroups(timeStartBlock, timeEndBlock, groupPeriods, '()');
                    if (resultOfChecking.isError) {
                        result.typeOfError = ErrorValidation.isNotPeriodTimeUniqueAmountAllGroups;
                        result.params = resultOfChecking.params;
                        result.isError = true;

                        return false;
                    }
                });
            }

            if (result.isError) {
                return false;
            }
        });
    });

    return result;
}

/**
 * Checks if the date is in the range.
 *
 * @param timeStartBlock - Start of period input.
 * @param timeEndBlock - End of period input.
 * @param {array} periods - Array of new selected periods.s
 * @param samplingLimits - Border options.
 * @example samplingLimits - '()', '[)', '(]', '[]'
 *
 * @returns {{isError: boolean}}
 */
function isPeriodTimeUnique(timeStartBlock, timeEndBlock, periods, samplingLimits) {
    const timeStart = $(timeStartBlock).val();
    const timeEnd = $(timeEndBlock).val();

    let result = {
        isError: false,
    };

    _.each(periods, function (periodTimes) {
        const startTimeOfPeriod = periodTimes.timeStart;
        const endTimeOfPeriod = periodTimes.timeEnd;

        if (checkDateIsBetween(startTimeOfPeriod, endTimeOfPeriod, timeStart, samplingLimits)) {
            result.isError = true;
            result.params = { element: timeStartBlock };

            return false;
        } else if (checkDateIsBetween(startTimeOfPeriod, endTimeOfPeriod, timeEnd, samplingLimits)) {
            result.isError = true;
            result.params = { element: timeEndBlock };

            return false;
        }
    });

    return result;
}

/**
 * Checks for uniqueness of period for all groups.
 *
 * @param timeStartBlock - Start of period input.
 * @param timeEndBlock - End of period input.
 * @param {array} periods - Array of new selected periods.s
 * @param samplingLimits - Border options.
 * @example samplingLimits - '()', '[)', '(]', '[]'
 *
 * @returns {{isError: boolean}}
 */
function isPeriodTimeUniqueAmountAllGroups(timeStartBlock, timeEndBlock, periods, samplingLimits) {
    const timeStart = $(timeStartBlock).val();
    const timeEnd = $(timeEndBlock).val();

    let result = {
        isError: false,
    };

    _.each(periods, function (periodTimes) {
        const startTimeOfPeriod = periodTimes.timeStart;
        const endTimeOfPeriod = periodTimes.timeEnd;

        if (timeStart === startTimeOfPeriod) {
            result.isError = true;
            result.params = { element: timeStartBlock };

            return false;
        } else if (timeEnd === endTimeOfPeriod) {
            result.isError = true;
            result.params = { element: timeEndBlock };

            return false;
        } else if (checkDateIsBetween(startTimeOfPeriod, endTimeOfPeriod, timeStart, samplingLimits)) {
            result.isError = true;
            result.params = { element: timeStartBlock };

            return false;
        } else if (checkDateIsBetween(startTimeOfPeriod, endTimeOfPeriod, timeEnd, samplingLimits)) {
            result.isError = true;
            result.params = { element: timeEndBlock };

            return false;
        }
    });

    return result;
}

/**
 * Checking that the start date will be less than the end date.
 *
 * @param start - Time start.
 * @param end - Time end.
 * @param object - edad
 * @param object.property1 -
 * @param object.property1.www
 *
 *
 * @returns {boolean|*}
 */
function checkStartDateIsLessThanEndDate(start, end, object) {
    const now = moment().format(formatDay);

    const startTime = moment(`${now} ${start}`, format12Hour);
    const endTime = moment(`${now} ${end}`, format12Hour);

    return startTime.isBefore(endTime);
}

/**
 * Checks if the date is in the between.
 *
 * @param start - Time start.
 * @param end - Time end.
 * @param time - Time to compare.
 * @param samplingLimits - Border options.
 * @example samplingLimits - '()', '[)', '(]', '[]'
 *
 * @returns {*|boolean}
 */
function checkDateIsBetween(start, end, time, samplingLimits) {
    const now = moment().format(formatDay);

    const timeToCompare = moment(`${now} ${time}`, format12Hour);
    const startTime = moment(`${now} ${start}`, format12Hour);
    const endTime = moment(`${now} ${end}`, format12Hour);

    return moment(timeToCompare).isBetween(startTime, endTime, null, samplingLimits);
}