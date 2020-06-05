function getInputStartTimeFilter(number) {
    return $(`${startTimeFilterInput}[data-number=${number}]`);
}

function getInputEndTimeFilter(number) {
    return $(`${endTimeFilterInput}[data-number=${number}]`);
}