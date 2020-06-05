/**
 * Initialization of all events availability functions.
 */
function initCalendarEvents() {
    dayCalendarClick();
    changeMonthForCalendarClick();
    changeCheckboxAllDay();
    typeOfTimeClick();
    closeAvailabilityClick();
}

/**
 * Choice of dates in the calendar.
 */
function dayCalendarClick() {
    $('.calendar-availability div').click(function () {
        if ($(this).parent().hasClass(notCurrentMonth)) {
            return;
        }

        const date = $(this).data('date');
        if (_.includes(selectedDays, date)) {
            const index = selectedDays.indexOf(date);
            if (index > -1) {
                selectedDays.splice(index, 1);
            } else {
                console.error('Unknown index');
            }

            $(this).removeClass(selectedDay);
        } else {
            selectedDays.push(date);
            $(this).addClass(selectedDay);
        }

        displaySelectedDates();
    });
}

/**
 * Month shift click processing.
 */
function changeMonthForCalendarClick() {
    $('.change-month-calendar').click(async function () {
        let date = $(selectedMonthAvailability).data('date');
        const startSelectedMonth = moment(date).startOf('month').format('YYYY-MM-DD');

        let firstDayOfMonth = '';
        let lastDayOfMonth = '';

        let period = $(this).attr('data-period');
        if (period === 'next') {
            firstDayOfMonth = moment(startSelectedMonth).add(1, 'month').format('YYYY-MM-DD');
            lastDayOfMonth = moment(firstDayOfMonth).endOf('month').format('YYYY-MM-DD');
        } else if (period === 'last') {
            firstDayOfMonth = moment(startSelectedMonth).subtract(1, 'month').format('YYYY-MM-DD');
            lastDayOfMonth = moment(firstDayOfMonth).endOf('month').format('YYYY-MM-DD');
        } else {
            firstDayOfMonth = moment().startOf('month').format('YYYY-MM-DD');
            lastDayOfMonth = moment().endOf('month').format('YYYY-MM-DD');
        }

        const data = {
            firstDayOfMonth, lastDayOfMonth,
        };

        await $.each($(`.${notCurrentMonth}`), function (index, element) {
            $(element).removeClass(notCurrentMonth)
        });

        await getDatesForCalendarRequest(data).then(dates => {
            $(tbodyCalendarClass).html('').html(dates.calendar);
            $(selectedMonthAvailability).text(dates.monthName);
            $(selectedMonthAvailability).data('date', dates.selectedDate);
            $(selectedYearAvailability).text(dates.year);
        });

        dayCalendarClick();
        drawSelectedDays();
    });
}

/**
 * Adds or removes blocks with temporary filters.
 *
 * @param element
 *
 * @returns {Promise<boolean>}
 */
async function actionsWithTimesFilters(element) {
    if ($('input[name="all_day"]:checked').val()) {
        return false;
    }

    const action = $(element).data('action');
    const mainBlock = $(element).parent().parent().parent();
    const mainBlockElement = $(mainBlock)[0];
    let number = $(mainBlockElement).data('number');
    if (action === 'add') {
        if ($(timeFiltersClass).size() === 8) {
            return false;
        }

        const data = { number: number + 1 };
        await getNewTimeFilter(data).then(timeFilter => {
            $(timeFiltersClass + '[data-number="' + number + '"]').after(timeFilter);
            let timeFiltersNumber = number + 1;
            let timeFilterBlock = $(timeFiltersClass + '[data-number="' + timeFiltersNumber + '"]').children();

            let timeStart = $(timeFilterBlock[0]).children().children()[1];
            let timeEnd = $(timeFilterBlock[1]).children().children()[1];

            initTimepicker(timeStart, 'h:i A', 5);
            initTimepicker(timeEnd, 'h:i A', 5);
        });
    } else if (action === 'remove') {
        if (number === 0) {
            return false;
        }

        $(timeFiltersClass + '[data-number="' + number + '"]').remove();
    }

    $.each($(timeFiltersClass), function (i, value) {
        $(value).attr('data-number', i)
    });
    $.each($('.other-filter-blocks'), function (i, value) {
        $(value).attr('data-number', i)
    });
}

/**
 * Blocking of inputs, if the checkbox 'All day' is selected.
 */
function changeCheckboxAllDay () {
    $('input[name="all_day"]').change(function () {
        if ($(this).is(":checked")) {
            $.each($(timeFiltersItem), function (index, value) {
                $(value).attr('disabled', 'disabled').addClass('input-disabled');
            });
        } else {
            $.each($(timeFiltersItem), function (index, value) {
                $(value).attr('disabled', false).removeClass('input-disabled');
            });
        }
    });
}

/**
 * Reactively checks the input for an empty value and that the beginning of the date is less than the end.
 *
 * @param element
 *
 * @returns {boolean}
 */
function changeTimeFilter(element) {
    if (!inputIsNotEmpty(element)) {
        new ErrorValidation(ErrorValidation.inputIsEmpty, { element });

        return false;
    }

    const name = $(element).attr('name');
    const number = $(element).data('number');
    const value = $(element).val();

    if (name === 'time_start_availability') {
        const endBlock = getInputEndTimeFilter(number);
        if (inputIsNotEmpty(endBlock)) {
            if (!checkStartDateIsLessThanEndDate(value, endBlock.val())) {
                const params = {
                    elements: { timeStartBlock: element, timeEndBlock: endBlock },
                };

                new ErrorValidation(ErrorValidation.startDateIsNotLessThanEndDate, params);
            }
        }
    } else {
        const startBlock = getInputStartTimeFilter(number);
        if (inputIsNotEmpty(startBlock)) {
            if (!checkStartDateIsLessThanEndDate(startBlock.val(), value)) {
                const params = {
                    elements: { timeStartBlock: startBlock, timeEndBlock: element},
                };

                new ErrorValidation(ErrorValidation.startDateIsNotLessThanEndDate, params);
            }
        }
    }
}

/**
 * Checking and saving all temporary filters for selected days.
 */
async function addAdditionalTimeClick(drawTable = true) {
    const validate = validateNewGroupDays();
    if (validate instanceof ErrorValidation) {
        return false;
    }

    const periods = getPeriods();

    const data = {
        times: dailyAvailabilityGroups,
        selectedDays,
        periods,
        typeOfTime: $('input[name="type_of_time"]:checked').val(),
        allDay: $('input[name="all_day"]:checked').val(),
    };


    return await checkNewGroup(data).then(response => {
        if (response.status === 'error') {
            alert(response.error);
            return false;
        } else {
            dailyAvailabilityGroups = response.data;
            if (drawTable) {
                restoreCalendarToItsOriginalState();
                drawTableForAvailability();
            }
            return true;
        }
    });
}

/**
 * Processing click on the time type selection checkbox.
 */
function typeOfTimeClick () {
    $(typeOfTimeInput).click(function() {
        $(typeOfTimeInput).not(this).prop('checked', false);
    });
}

function removeGroupAvailability(key) {
    dailyAvailabilityGroups.splice(key);
    drawTableForAvailability();
}

/**
 * Sets data for editing.
 *
 * @param key
 *
 * @returns {boolean}
 */
function editGroupAvailability (key) {
    const changesAlreadyExist = checkOnChanges();
    if (changesAlreadyExist) {
        let stopEditing = confirm(overwriteChanges);
        if (!stopEditing) {
            return false;
        }
    }

    restoreCalendarToItsOriginalState();
    setGroupOnEditing(key);
}

/**
 * Saves all changes in multiple accessibility.
 *
 * @returns {Promise<boolean>}
 */
async function saveAvailabilityClick() {
    const changesAlreadyExist = checkOnChanges();
    if (changesAlreadyExist) {
        const result = await addAdditionalTimeClick(false);
        if (!result) {
            return false;
        }
    }

    saveAvailability({ dailyAvailabilityGroups }).then(async response => {
        if (response.status === 'OK') {
            getSchedule().then(schedule => {
                removeBlockWithClass(scheduleBlockClass);
                removeBlockWithClass(scheduleBlockIgnoreClass);
                changeCellHeight(schedule.cellsHeight);
                fillTablesWithData(schedule.schedule);
                $(availabilityModalId).modal('hide');
                restoreCalendarToItsOriginalState();
                dailyAvailabilityGroups = [];
                initScheduleEvents();
            });
        } else {
            dailyAvailabilityGroups.splice(dailyAvailabilityGroups.length - 1, 1);
            alert(response.error);
        }
    });
}

/**
 * Catches the event of closing the window, if there are changes, then offers to cancel the action.
 */
function closeAvailabilityClick() {
    $(closeAvailabilityId).click(e => {
        e.preventDefault();
        const changesAlreadyExist = checkOnChanges();

        if (changesAlreadyExist || !_.isEmpty(dailyAvailabilityGroups)) {
            let resultConfirm = confirm(closingWindowIfThereAreChanges);
            if (resultConfirm) {
                dailyAvailabilityGroups = [];
                selectedDays = [];
            }

            return resultConfirm;
        }
    });
}