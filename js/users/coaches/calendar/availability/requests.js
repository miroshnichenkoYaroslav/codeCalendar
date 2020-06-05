function getNewTimeFilter(data) {
    return new Promise(resolve => {
        $.ajax({
            method: 'POST',
            data,
            url: 'get_new_time_filter_for_calendar',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function checkNewGroup(data) {
    return new Promise(resolve => {
        $.ajax({
            method: 'POST',
            data,
            url: 'check_new_group',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getTableForAvailabilityGroups(data) {
    return new Promise(resolve => {
        $.ajax({
            method: 'POST',
            data,
            url: 'get_table_for_availability_groups',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getFiltersForGroup(data) {
    return new Promise(resolve => {
        $.ajax({
            method: 'POST',
            url: 'get_filters_for_group',
            data,
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function saveAvailability(data) {
    return new Promise(resolve => {
        $.ajax({
            method: 'POST',
            url: 'save_availability_for_coach',
            data,
            success: function (response) {
                resolve(response);
            }
        });
    });
}