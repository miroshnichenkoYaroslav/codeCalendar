/**
 * Gets a list of periods.
 *
 * @returns {{}}
 */
function getPeriods() {
    let periods = {};

    _.each($(timeFiltersClass), function (value) {
        const timeFiltersNumber = $(value).data('number');

        const timeStartBlock = getInputStartTimeFilter(timeFiltersNumber);
        const timeEndBlock = getInputEndTimeFilter(timeFiltersNumber);

        const timeStart = $(timeStartBlock).val();
        const timeEnd = $(timeEndBlock).val();

        periods[timeFiltersNumber] = {timeStart, timeEnd};
    });

    return periods;
}
