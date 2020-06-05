/**
 * Initialization of all events.
 * Which will not be re-initialized.
 */
function initScheduleEvents() {
    hideScheduleModalEvent();
    addEventsForBlocks();
    actionButtonClick();
    setAvailabilityButtonClick();
    quickAccessToDate();
    initCalendarForQuickAccessToDate();
}

/**
 * Processing event closing modal window.
 */
function hideScheduleModalEvent() {
    $(modalSchedule).on('hide.bs.modal', function () {
        getActionSelectionRequest().then(response => {
            $(modalContentId).html('').html(response);
            actionButtonClick();
        });
    });
}

/**
 * Events for each schedule block.
 */
function addEventsForBlocks () {
    $('.save_notes_btn').click(function () {
        const lessonId = $(this).data('lesson_id');
        const notes = $('#lesson_notes').val();
        setNotesForLesson(lessonId, notes).then(result => {
            $('.notes').html('').html(result);
        });
    });

    $('.edit_note').click(function () {
        const lessonId = $(this).data('lesson_id');
        const notes = $('.notes_content').html();
        editNotesForLesson(lessonId, notes).then(result => {
            $('.notes').html('').html(result);
        });
    })
}

/**
 * Events for all tables.
 */
function mouseUpTable(element) {
    const selectedCellsData = getSelectedCellData(element);
    const selectedDate = $(element).data('date');

    let dataOfSelectedCells = [];
    $.each(selectedCellsData, function (index, cell) {
        dataOfSelectedCells[index] = $(cell).data();
        dataOfSelectedCells[index]['date'] = selectedDate;
    });

    if (!_.isEmpty(dataOfSelectedCells)) {
        window.dayName = dataOfSelectedCells[0].day_name;
        window.dateOfSelectedDay = dataOfSelectedCells[0].date;
        window.timeFrom = dataOfSelectedCells[0].time_from;
        window.timeTill = dataOfSelectedCells[dataOfSelectedCells.length - 1].time_till;

        calculatePositionOfModalWindow(event);
    }
}

/**
 * Action selection handler when adding new time.
 */
function actionButtonClick() {
    $('.action_button').click(function () {
        const action = $(this).data('action');

        const options = {
            dayName: window.dayName,
            timeFrom: window.timeFrom,
            timeTill: window.timeTill,
            dateOfSelectedDay: window.dateOfSelectedDay,
            action,
        };

        modalWindowContentRequest(options)
            .then(response => {
                $(modalContentId).html('').html(response);
                $(modalSchedule).scrollTop($(modalDialogScheduleClass).height());
                $(modalSchedule).css('margin-bottom', 10);
            });
    });
}

/**
 * Connects input with timer.
 *
 * @param id
 * @param timeFormat
 * @param step
 */
function initTimepicker(id, timeFormat, step) {
    $(id).timepicker({
        timeFormat,
        step,
        minTime: '06:00',
        maxTime: '11:00 PM',
    });
}

/**
 * Click processing on time change buttons.
 */
function dateChangeClick(action) {
    let period = $(this).attr('data-period');

    if (calendar.view === 'day') {
        changeDaySchedule(period, action);
    } else if (calendar.view === 'week') {
        changeWeekSchedule(period, action);
    } else if (calendar.view === 'month') {

    }

    let actionBackPeriod = $(actionBack).attr('data-period');
    let actionForwardPeriod = $(actionForward).attr('data-period');

    if (action === 'back') {
        $(actionBack).attr('data-period', --actionBackPeriod);
        $(actionForward).attr('data-period', --actionForwardPeriod);
    } else if (action === 'forward') {
        $(actionBack).attr('data-period', ++actionBackPeriod);
        $(actionForward).attr('data-period', ++actionForwardPeriod);
    } else {
        $(actionBack).attr('data-period', -1);
        $(actionForward).attr('data-period', 1);
    }

    $.each($('.ignore'), function (index, value) {
        $(value).removeClass('ignore');
    });

    removeBlockWithClass(scheduleBlockClass);
    removeBlockWithClass(scheduleBlockIgnoreClass);

    getSchedule().then(async schedule => {
        await drawScheduleDisplay(schedule.scheduleDisplay);
        fillTablesWithData(schedule.schedule);
        initTableCellData();
    });
}

/**
 * Click on the button to display the coach availability window.
 */
function setAvailabilityButtonClick() {
    $(setAvailability).click(async function () {
        await initCalendar();
    });
}

/**
 * Tracking mouse enter event on block. If it is possible to show the block in full,
 * then changing styles shows it in full height.
 *
 * @param element
 * @param keyInSchedule
 */
function mouseenterBlock(element, keyInSchedule) {
    const thisElement = $(element);
    const id = thisElement.attr('id');
    const blockInfo = schedule[keyInSchedule][id];

    lastElementIdThatHadMouseenterEvent = id;

    setTimeout(() => {
        if (lastElementIdThatHadMouseenterEvent === id) {
            thisElement.css('max-height', '')
                .css('min-height', blockInfo.heightForOutput)
                .css('overflow', '')
                .css('z-index', 2000);
        }
    }, 500);
}

/**
 * Tracking mouse enter event on block. Shows a block in size so that it fits in the right period.
 *
 * @param element
 * @param keyInSchedule
 */
function mouseleaveBlock(element, keyInSchedule) {
    const thisElement = $(element);
    const id = thisElement.attr('id');
    const blockInfo = schedule[keyInSchedule][id];

    lastElementIdThatHadMouseenterEvent = null;
    thisElement.css('z-index', '');

    cronBlockIfGreaterThanMaximumAvailableHeight(blockInfo);
}

/**
 * Click on the body in the lesson block.
 * s
 * @param element
 * @param block
 * @param event
 */
function clickLessonBody(element, block, event) {
    const thisElement = $(element);
    const id = thisElement.data('lesson_id');

    lastLessonBlockClick = { id, block, removalIsAllowed: true };

    setTimeout(async function () {
        if (lastLessonBlockClick.block === block && lastLessonBlockClick.id === id && lastLessonBlockClick.removalIsAllowed) {
            const lesson = schedule['lessons'][`lesson-${id}`];
            const width = $(tdBody).width();
            let height = null;

            if (lesson.overallDuration < minHeightsForBlocks[lesson.type].minDurationForFullDisplay) {
                height = getAvailableBlockHeight(lesson.overallDuration, lesson.type);
            } else {
                height = 90 * lesson.overallDuration / 60;
            }

            const lessonId = thisElement.data('lesson_id');
            const lessonColor = thisElement.data('color');

            await getLessonInfo(lessonId, lessonColor).then(result => {
                $(lessonModalContentId).html('').html(result);
            });
            calculatePositionOfModalWindow2(event, lessonModal, width * 0.9, height);
        }
    }, 300);
}

/**
 * Click on the header in the lesson block.
 *
 * @param element
 * @param block
 * @param event
 *
 * @returns {Promise<void>}
 */
async function clickLessonHeader(element, block, event) {
    const thisElement = $(element);
    const id = thisElement.data('lesson_id');

    setTimeout(function () {
        lastLessonBlockClick = { id, block, removalIsAllowed: false };
    }, 200);

    const lesson = schedule['lessons'][`lesson-${id}`];
    const width = $(tdBody).width();
    let height = null;

    if (lesson.overallDuration < minHeightsForBlocks[lesson.type].minDurationForFullDisplay) {
        height = getAvailableBlockHeight(lesson.overallDuration, lesson.type);
    } else {
        height = 90 * lesson.overallDuration / 60;
    }

    const studioId = thisElement.data('studio_id');
    await getStudioInfo(studioId).then((result => {
        $(studioInfoModalContentId).html('').html(result);
    }));

    calculatePositionOfModalWindow2(event, studioInfoModal, width * 0.9, height);
}

/**
 * Added modal window display for available time.
 *
 * @param element
 * @param event
 *
 * @returns {Promise<boolean>}
 */
async function availabilityOrPersonalBlockClick(element, event) {
    const id = $(element).data('id');

    const result = await getEditFormForPersonalOrAvailabilityRequest(id).then(response => {
        if (response.status === 'OK') {
            $('#availability-schedule-block-dialog').html('').html(response.editModal);
            $(availabilityScheduleBlock).scrollTop($(modalDialogScheduleClass).height());
            $(availabilityScheduleBlock).css('margin-bottom', 10);
            return true;
        } else if (response.status === 'error') {
            alert(response.error);
            return false;
        }
    });

    if (!result) {
        return false;
    }

    const availability = schedule['personalAndAvailabilityTimes'][`personalOrAvailability-${id}`];
    const width = $(tdBody).width();
    let height = null;

    if (availability.overallDuration < minHeightsForBlocks[availability.type].minDurationForFullDisplay) {
        height = getAvailableBlockHeight(availability.overallDuration, availability.type);
    } else {
        height = 90 * availability.overallDuration / 60;
    }

    calculatePositionOfModalWindow2(event, availabilityScheduleBlock, width * 0.9, height);
}

/**
 * Calendar display change, changes to day, week, month.
 *
 * @param view
 *
 * @returns {Promise<boolean>}
 */
async function changeDisplayClick(view) {
    calendar.lastView = calendar.view;

    const lastStart = calendar.betweenPeriods.start;

    let start = null;
    let end = null;

    if (calendar.lastView === view) {
        return false;
    }

    if (calendar.lastView === 'day') {
        if (view === 'week') {
            start = moment(lastStart).isoWeekday("monday").format('YYYY-MM-DD');
            end =  moment(lastStart).isoWeekday("sunday").format('YYYY-MM-DD');
        } else if (view === 'month') {
            //start = moment(lastStart).startOf('month').format('YYYY-MM-DD hh:mm');
            //end = moment(lastStart).endOf('month').format('YYYY-MM-DD hh:mm');
        }
    } else if (calendar.lastView === 'week') {
        if (view === 'day') {
            start = moment(lastStart).format('YYYY-MM-DD');
            end = moment(lastStart).format('YYYY-MM-DD');
        } else if (view === 'month') {

        }
    } else if (calendar.lastView === 'month') {
        if (view === 'day') {
           // todo
        } else if (view === 'month') {
           // todo
        }
    }

    $('.quick-access-to-date-calendar').datepicker('update', new Date(start));
    calendar.betweenPeriods = { start, end };
    calendar.view = view;

    await getSchedule()
        .then(async schedule => {
            await drawScheduleDisplay(schedule.scheduleDisplay);
            changeCellHeight(schedule.cellsHeight);
            fillTablesWithData(schedule.schedule);
            initTableCellData();
        });
}

/**
 * Changes arrows for quick access calendar.
 */
function quickAccessToDate() {
    $('.quick-access-to-date').click(function () {
        const arrowDirection = $(this).data('arrow_direction');
        if (arrowDirection === 'down') {
            $('#arrow').removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
            $(this).data('arrow_direction', 'up');
            $('.quick-access-to-date-calendar-block').css('display', 'block');
        } else {
            $('#arrow').removeClass('fa-angle-double-up').addClass('fa-angle-double-down');
            $(this).data('arrow_direction', 'down');
            $('.quick-access-to-date-calendar-block').css('display', 'none');
        }
    });
}

/**
 * Initialization of the calendar of quick access to the date,
 * keeps track of the selection changes and updates the schedule.
 */
function initCalendarForQuickAccessToDate() {
    $(quickAccessToDateCalendarClass).datepicker().on('changeDate', async function(e) {
        const date = moment(e.date).format('YYYY-MM-DD');
        if (calendar.view === 'day') {
            start = moment(date).format('YYYY-MM-DD');
            end = moment(date).format('YYYY-MM-DD');
        } else if (calendar.view === 'week') {
            start = moment(date).isoWeekday("monday").format('YYYY-MM-DD');
            end =  moment(date).isoWeekday("sunday").format('YYYY-MM-DD');
        } else if (calendar.view === 'month') {
            // todo
        }

        calendar.betweenPeriods = { start, end };

        await getSchedule()
            .then(async schedule => {
                await drawScheduleDisplay(schedule.scheduleDisplay);
                changeCellHeight(schedule.cellsHeight);
                fillTablesWithData(schedule.schedule);
                initTableCellData();
            });

        lastSelectedDateOnCalendar = date;
    });
}

/**
 * Processes the click on the button, if this is the second click on the button, it copies the link to the clipboard.
 *
 * @returns {Promise<boolean>}
 */
async function generateLinkForGoogleCalendar() {
    if (linkForGoogleCalendarReceived) {
        new ClipboardJS('#link-my-calendar');
        return false;
    }

    await generateLinkForGoogleCalendarRequest().then(response => {
        let link = `${location.origin}/danceboardcalendar.ics/${response.token}`;

        $(linkMyCalendarId).attr('data-clipboard-text', link);
        $(linkMyCalendarId).attr('title', 'Copied!');
        $(linkMyCalendarId).attr('data-original-title', 'Copied!');
        $(linkMyCalendarId).tooltip('show');

        linkForGoogleCalendarReceived = true;
        $(linkMyCalendarId).trigger('click');

        setTimeout(function () {
            const title = 'This link will allow you to add your DCC calendar to your personal calendar tool such as google,\n' +
                'outlook, or other calendar application. Just click the icon to copy your personal calendar link,\n' +
                'then paste the link as directed by your other calendar application.';
            $(linkMyCalendarId).tooltip('hide');
            $(linkMyCalendarId).attr('title', title);
            $(linkMyCalendarId).attr('data-original-title', title);
        }, 500);
    });
}