/**
 * Time groups from selected days with time filters.
 *
 * @type {*[]}
 */
let dailyAvailabilityGroups = [];


/**
 * Selected days on the calendar.
 *
 * @type {*[]}
 */
let selectedDays = [];

/**
 * Starting launch of all schedule functions.
 *
 * @returns {Promise<void>}
 */
async function initCalendar() {
    await getSetAvailabilityModalRequest()
        .then(response => {
            $(availabilityModalContentId).html('').html(response);
            $(availabilityModalId).modal();

            initTimepicker($(startTimeFilterInput), 'h:i A', 5);
            initTimepicker($(endTimeFilterInput), 'h:i A', 5);
        });

    const data = {
        'firstDayOfMonth': moment().startOf('month').format('YYYY-MM-DD'),
        'lastDayOfMonth': moment().endOf('month').format('YYYY-MM-DD'),
    };

    processCalendarData(data).then(() => {
        initCalendarEvents();
    });
}