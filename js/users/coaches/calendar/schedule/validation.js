/**
 * Comparison of start and end dates.
 *
 * @param timeFrom
 * @param timeTill
 *
 * @returns {boolean}
 */
function timeFromShouldBeLessThanTimeTill(timeFrom, timeTill) {
    return moment(new Date(timeFrom)) <= moment(new Date(timeTill));
}