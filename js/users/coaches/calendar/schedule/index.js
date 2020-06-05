/**
 * Coach's schedule for the selected month.
 *
 * @type {{}}
 */
let schedule = {};

/**
 * A set of settings for heights that are less than the full height.
 */
const minHeightsForBlocks = {
    personalOrAvailability: {
        sizes: {
            10: 14,
            20: 28,
        },
        minDurationForFullDisplay: 20,
    },
    lesson: {
        sizes: {
            10: 14,
            20: 28,
            30: 42,
            40: 56,
            50: 70,
        },
        minDurationForFullDisplay: 40,
    },
};

/**
 * Id of the last element whose mouseenter event fired.
 *
 * @type {null}
 */
let lastElementIdThatHadMouseenterEvent = null;

/**
 * Data on the last block that was clicked is needed for the delay.
 *
 * @type {{}}
 */
let lastLessonBlockClick = {};

/**
 * Last selected date on the quick access to date calendar.
 *
 * @type {null}
 */
let lastSelectedDateOnCalendar = null;

/**
 * Writing to the buffer occurs only after a click,
 * but I don't have time to replace the data-clipboard-text attribute,
 * so I simulate a second click, and the variable confirms that the first click was already.
 *
 * @type {boolean}
 */
let linkForGoogleCalendarReceived = false;
/**
 * Starting launch of all schedule functions.
 *
 * @returns {Promise<void>}
 */
async function init() {
    await getSchedule()
        .then(async schedule => {
            await drawScheduleDisplay(schedule.scheduleDisplay);
            changeCellHeight(schedule.cellsHeight);
            fillTablesWithData(schedule.schedule);
            initScheduleEvents();
        });
    initTableCellData();
}