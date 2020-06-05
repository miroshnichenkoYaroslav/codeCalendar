/**
 * Current between.
 *
 * @type {{}}
 */
let betweenPeriods = {};

/**
 * Display data for calendar.
 *
 * @type {{view: string, betweenPeriods: {start: *, end: *}, lastView: string}}
 */
let calendar = {
    betweenPeriods: {
        start: moment().isoWeekday("monday").format('YYYY-MM-DD'),
        end: moment().isoWeekday("sunday").format('YYYY-MM-DD'),
    },
    view: 'week',
    lastView: 'week',
};