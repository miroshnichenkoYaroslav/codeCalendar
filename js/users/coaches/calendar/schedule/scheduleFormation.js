/**
 * Receives a schedule(personal, available, lessons, coach in studio times) with a specified limit and period.
 *
 * @returns {Promise<unknown>}
 */
async function getSchedule() {
    return new Promise(resolve => {
        if (calendar.view === 'day') {
            getScheduleRequest(calendar).then(schedule => resolve(schedule));
        } else if (calendar.view === 'week') {
            getScheduleRequest(calendar).then(schedule => resolve(schedule));
        } else if (calendar.view === 'month') {
            // TODO new method
            // getScheduleMonthRequest(data).then(schedule => resolve(schedule));
        }
    });
}

/**
 * Fills the table with blocks (personal, available, lesson, coach in studio times).
 *
 * @param scheduleData
 */
function fillTablesWithData(scheduleData) {
    schedule = scheduleData;
    fillTdContent(schedule.timesCoachIsInStudio || []);
    fillTdContent(schedule.personalAndAvailabilityTimes || []);
    fillTdContent(schedule.lessons || []);
}

/**
 * Shows the modal window, calculates the coordinates of the place the mouse was clicked
 * and positions the modal window relative to them.
 *
 * @param event
 */
function calculatePositionOfModalWindow (event) {
    const windowInnerWidth = window.innerWidth;
    const windowInnerHeight = window.innerHeight;

    if (windowInnerWidth <= 1400) {
        $(modalDialogScheduleClass).css('top', 0).css('left', 0);
        $(modalSchedule).modal();
        return;
    } else if (calendar.view === 'day') {
        $(modalDialogScheduleClass).css('top', 0).css('left', 0);
        $(modalSchedule).modal();
        return;
    }

    $(modalDialogScheduleClass).css('margin', 0);
    $(modalSchedule).modal();

    const widthModalDialogSchedule = $(modalDialogScheduleClass).width();
    const heightModalDialogSchedule = $(modalDialogScheduleClass).height();

    const tdWidth = $(tdBody).width();
    const tdHeight = $(tdBody).height();

    let top = event.clientY - event.offsetY + (tdHeight - 10);
    if (top + heightModalDialogSchedule + tdHeight > windowInnerHeight) {
        top = top - heightModalDialogSchedule - (tdHeight - 20);
    }

    let left = event.clientX - event.offsetX + (tdWidth - 10);
    if (left + widthModalDialogSchedule + tdWidth > windowInnerWidth) {
        left = left - widthModalDialogSchedule - (tdWidth - 20);
    }

    $(modalDialogScheduleClass).css('top', top).css('left', left);
}

/**
 * Adds to td block (personal, available, lesson, coach in studio times).
 *
 * @param times
 */
function fillTdContent (times) {
    $.each(times, function (index, value) {
        const element = $(`div[data-time_from="${value.selectors.time_from}"][data-day_name="${value.selectors.day_name}"]`);
        element.append(value.html_block);
        $('td[data-time_from="' + value.selectors.time_from + '"][data-day_name="' + value.selectors.day_name + '"]').addClass('ignore');
        $.each(value.cellsThatArePartOfBlock, function (indexCell, timeCell) {
            $('td[data-time_from="' + timeCell + '"][data-day_name="' + value.selectors.day_name + '"]').addClass('ignore');
        });

        cronBlockIfGreaterThanMaximumAvailableHeight(value);
    });
}

/**
 * Changes the height of all cells in a row.
 *
 * @param cellsHeight
 */
function changeCellHeight(cellsHeight) {
    $.each(cellsHeight, function (time, height) {
        const cells = $('td[data-time_from="' + time + '"]');
        cells.children().css('min-height', height).addClass('modified-height');

        const timeCells = $('tr[data-time_from="' + time + '"]');
        timeCells.css('height', height).addClass('modified-height');
    })
}

/**
 * Deleting a block with a class.
 *
 * @param className
 */
function removeBlockWithClass(className) {
    $(className).remove();
}

/**
 * Removes a class from every block that has this class.
 *
 * @param className
 */
function removeClassFromBlock(className) {
    $.each($(`.${className}`), function (index, element) {
        $(element).removeClass(className)
    });
}

/**
 * Cuts the block to the parameters based on the allowed height.
 *
 * @param value
 */
function cronBlockIfGreaterThanMaximumAvailableHeight(value) {
    if (value.type !== 'coachSessionInStudio') {
        const id = `#${value.type}-${value.id}`;
        if (value.overallDuration < minHeightsForBlocks[value.type].minDurationForFullDisplay) {
            const height = getAvailableBlockHeight(value.overallDuration, value.type);
            $(id).css('min-height', '')
                .css('max-height', `${height}px`)
                .css('overflow', 'hidden');
        }
    }
}

/**
 * Gets allowed height.
 *
 * @param overallDuration
 * @param typeOfBlock
 *
 * @returns {*|string}
 */
function getAvailableBlockHeight(overallDuration, typeOfBlock) {
    if (overallDuration <= 10)                              return minHeightsForBlocks[typeOfBlock].sizes[10];
    else if (overallDuration > 10 && overallDuration <= 20) return minHeightsForBlocks[typeOfBlock].sizes[10];
    else if (overallDuration > 20 && overallDuration <= 30) return minHeightsForBlocks[typeOfBlock].sizes[30];
    else if (overallDuration > 30 && overallDuration <= 40) return minHeightsForBlocks[typeOfBlock].sizes[40];
}

/**
 * Shows the modal window, calculates the coordinates of the place the mouse was clicked
 * and positions the modal window relative to them.
 *
 * @param event
 * @param mainModalBlock
 * @param widthElementEvent
 * @param heightElementEvent
 */
function calculatePositionOfModalWindow2 (event, mainModalBlock, widthElementEvent, heightElementEvent) {
    const children = $(mainModalBlock).children();
    const windowInnerWidth = window.innerWidth;
    const windowInnerHeight = window.innerHeight;

    if (windowInnerWidth <= 1400 ) {
        $(children).css('top', 0).css('left', 0);
        $(mainModalBlock).modal();
        return;
    } else if (calendar.view === 'day') {
        $(children).css('top', 0).css('left', 0);
        $(mainModalBlock).modal();
        return;
    }

    $(children).css('margin', 0);
    $(mainModalBlock).modal();

    const heightModal = $(children).height();
    let top = event.clientY - event.offsetY + (heightElementEvent - 10);
    if (top + heightModal + heightElementEvent > windowInnerHeight) {
        top = top - heightModal - (heightElementEvent - 20);
    }

    const widthModal = $(children).width();
    let left = event.clientX - event.offsetX + (widthElementEvent - 10);
    if (left + widthModal + widthElementEvent > windowInnerWidth) {
        left = left - widthModal - (widthElementEvent - 20);
    }

    $(children).css('top', top).css('left', left);
}

/**
 * Inserts data into the main block.
 *
 * @param scheduleDisplay
 */
function drawScheduleDisplay(scheduleDisplay) {
    $(scheduleDisplayMainBlock).html('').html(scheduleDisplay);
}

/**
 * Time shift processing to display week view.
 *
 * @param period
 * @param action
 */
function changeWeekSchedule(period, action) {
    const lastSelectedDays = calendar.betweenPeriods.start;

    let start = null;
    let end = null;

    if (action === 'forward') {
        start =  moment(lastSelectedDays).isoWeekday("monday").add(7, 'day').format('YYYY-MM-DD');
        end =  moment(lastSelectedDays).isoWeekday("sunday").add(7, 'day').format('YYYY-MM-DD');
    } else if (action === 'back') {
        start =  moment(lastSelectedDays).isoWeekday("monday").subtract(7, 'day').format('YYYY-MM-DD');
        end =  moment(lastSelectedDays).isoWeekday("sunday").subtract(7, 'day').format('YYYY-MM-DD');
    } else {
        start = moment().isoWeekday("monday").format('YYYY-MM-DD');
        end = moment().isoWeekday("sunday").format('YYYY-MM-DD');
    }

    calendar.betweenPeriods = { start, end };

    const diff = moment(start).diff(lastSelectedDateOnCalendar, 'weeks');
    if (diff !== 0 ) {
        updateDatepicker(start);
    }
}

/**
 * Time shift processing to display day view.
 *
 * @param period
 * @param action
 */
function changeDaySchedule(period, action) {
    const lastSelectedDays = calendar.betweenPeriods.start;
    let selectedDay = '';
    if (action === 'forward') {
        selectedDay = moment(lastSelectedDays).add(1, 'day').format('YYYY-MM-DD');
    } else if (action === 'back') {
        selectedDay = moment(lastSelectedDays).subtract(1, 'day').format('YYYY-MM-DD');
    } else {
        selectedDay = moment().format('YYYY-MM-DD');
    }

    calendar.betweenPeriods = {
        start: selectedDay,
        end: selectedDay,
    };

    updateDatepicker(selectedDay);
}

/**
 * Time shift processing to display month view.
 *
 * @param period
 * @param action
 */
function changeMonthSchedule(period, action) {

}

function updateDatepicker(date) {
    $(quickAccessToDateCalendarClass).datepicker('update', new Date(date));
}