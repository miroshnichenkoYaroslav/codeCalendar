/**
 * Forms a list of selected dates and displays them in a block.
 */
function displaySelectedDates() {
    let selectedDaysString = '';

    $.each(selectedDays, function (index, date) {
        const dateFormat = moment(date).format('MMM D');
        if (index === 0) {
            selectedDaysString = dateFormat;
        } else if (index === 1) {
            selectedDaysString += `, ${dateFormat}`;
        } else {
            selectedDaysString += `, and ${selectedDays.length - 2} other dates`;
            return false;
        }
    });

    $('.selected-days').text(selectedDaysString);
}

/**
 * Fills the availability calendar with data (list of days, month name, year).
 *
 * @param week
 * @param dates
 */
function fillCalendar(week, dates) {
    $.each(dates, function (index, value) {
        const td = $(`.week-${week}`).children()[index];
        $(td).html('<div></div>');
        $(td).children().text(value.day).attr('data-date', value.date);

        if (!value.isCurrentMonth) {
            $(td).addClass('not-current-month');
        }
    });
}

/**
 * Deletes old data and fills new calendar.
 *
 * @param data
 *
 * @returns {Promise<void>}
 */
async function processCalendarData(data) {
    await removeClassFromBlock(notCurrentMonth);

    await getDatesForCalendarRequest(data).then(dates => {
        $(tbodyCalendarClass).html('').html(dates.calendar);
        $(selectedMonthAvailability).text(dates.monthName);
        $(selectedMonthAvailability).data('date', dates.selectedDate);
        $(selectedYearAvailability).text(dates.year);
    });
}

/**
 * Returns the calendar to its original state, resets all inputs, selected days, and checkboxes.
 */
function restoreCalendarToItsOriginalState() {
    removeTimesFilters();
    makeCheckboxesNotSelected();
    removeClassFromBlock(disabledInputNameOfClass);
    removeClassFromBlock(selectedDay);
    selectedDays = [];
    displaySelectedDates();
}

/**
 * Removes all times filters except one(first).
 */
function removeTimesFilters() {
    _.each($(timeFiltersClass), function (value) {
        if ($(value).data('number') !== 0) {
            $(value).remove();
        } else {
            const number = $(value).data('number');
            const startBlock = $('input[name="time_start_availability"][data-number="' + number + '"]');
            const endBlock = $('input[name="time_end_availability"][data-number="' + number + '"]');
            $(startBlock).removeAttr('disabled').val('');
            $(endBlock).removeAttr('disabled').val('');
        }
    });
}

/**
 * Makes All Day and type of time checkboxes not selected.
 */
function makeCheckboxesNotSelected() {
    const checkedAllDayInput = $(`${allDayInput}:checked`);
    if (checkedAllDayInput.val()) {
        $(checkedAllDayInput).removeAttr('checked');
    }

    const checkedTypeOfTimeInput = $(`${typeOfTimeInput}:checked`);
    if (checkedTypeOfTimeInput.val()) {
        checkedTypeOfTimeInput.removeAttr('checked');
    }
}

/**
 * Draws a table from the data of selected groups.
 */
function drawTableForAvailability() {
    if (_.isEmpty(dailyAvailabilityGroups)) {
        $(selectedGroups).remove();
        return;
    }

    getTableForAvailabilityGroups({ dailyAvailabilityGroups }).then(response => {
        $(selectedGroups).remove();
        $(setAvailabilityModalBody).prepend(response.groupOfDaysForAvailabilityTable);
    });
}

/**
 * Substitutes data for editing (time filters, time type, selected).
 *
 * @param key
 */
function setGroupOnEditing(key) {
    _.each(dailyAvailabilityGroups[key].selectedDays, function (value) {
        $(`div[data-date=${value}]`).addClass(selectedDay);
    });

    displaySelectedDates();
    $(`${typeOfTimeInput}[value=${dailyAvailabilityGroups[key].typeOfTime}]`).prop('checked', true);

    if (dailyAvailabilityGroups[key].allDay) {
        $(`${allDayInput}[value=${dailyAvailabilityGroups[key].allDay}]`).prop('checked', true).trigger('change');
    } else {
        getFiltersForGroup({ periods: dailyAvailabilityGroups[key].periods}).then(response => {
            $(timeFiltersClass).remove();
            $(filtersClass).append(response.timeFilters);
            _.each($(availabilityInputTimeClass), function (value) {
                initTimepicker(value, 'h:i A', 5);
            });
        });
    }

    removeGroupAvailability(key);
}

/**
 * Checks for changes in the availability window.
 *
 * @returns {boolean}
 */
function checkOnChanges() {
    const allDay = $(`${allDayInput}:checked`).val();
    const periods = getPeriods();
    const typeOfTime = $(`${typeOfTimeInput}:checked`).val();
    let changesAlreadyExist = false;

    if (!_.isEmpty(selectedDays) || allDay === 'yes' || typeOfTime) {
        changesAlreadyExist = true;
    }
    _.each(periods, function (value) {
        if (value.timeStart || value.timeEnd) {
            changesAlreadyExist = true;
            return false;
        }
    });

    return changesAlreadyExist;
}

/**
 * Adds a class to selected days of the current month.
 */
function drawSelectedDays() {
    _.each(selectedDays, function (value) {
        $(`div[data-date=${value}]`).addClass(selectedDay);
    });
}