/**
 * Request to save a new time (personal or available times).
 *
 * @param data
 *
 * @returns {Promise}
 */
function storeNewTimeRequest(data) {
    return new Promise((resolve) => {
        $.ajax({
            url: 'coach_schedule',
            method: 'POST',
            data,
            success: function (response) {
                resolve(response);
            },
        });
    });
}

/**
 * Gets content for modal window.
 *
 * @param options
 *
 * @returns {Promise}
 */
function modalWindowContentRequest(options) {
    return new Promise((resolve) => {
        $.ajax({
            url: `coach_schedule/create`,
            method: 'GET',
            data: options,
            success: function (response) {
                resolve(response);
            },
        });
    });
}

/**
 * Request for content for the selected action.
 *
 * @returns {Promise}
 */
function getActionSelectionRequest() {
    return new Promise((resolve) => {
        $.ajax({
            url: 'get_action_selection',
            method: 'POST',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getSetAvailabilityModalRequest() {
    return new Promise((resolve) => {
        $.ajax({
            url: 'get_set_availability',
            method: 'POST',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getStudioInfo(studioId) {
    return new Promise((resolve) => {
        $.ajax({
            method: "POST",
            url: 'get_studio_info/' + studioId,
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getLessonInfo(lessonId, color) {
    return new Promise((resolve) => {
        $.ajax({
            method: "GET",
            data: {color: color},
            url: `get-lesson-info/${lessonId}`,
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function setNotesForLesson(lessonId, notes) {
    return new Promise((resolve) => {
        $.ajax({
            method: "POST",
            data: {lessonId: lessonId, lessonNotes: notes},
            url: 'set-lesson-notes',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function editNotesForLesson(lessonId, notes) {
    return new Promise((resolve) => {
        $.ajax({
            method: "GET",
            data: {lessonId: lessonId, lessonNotes: notes},
            url: 'edit-lesson-notes-form',
            success: function (response) {
                resolve(response);
            }
        });
    });
}

function getDatesForCalendarRequest(data) {
    return new Promise((resolve) => {
        $.ajax({
            method: 'POST',
            url: 'get_dates_for_schedule_availability',
            data: data,
            success: function (dates) {
                resolve(dates);
            },
        });
    });
}

function getScheduleRequest(data) {
    return new Promise((resolve) => {
        $.ajax({
            method: 'POST',
            url: 'get_schedule',
            data: data,
            success: function (schedule) {
                resolve(schedule);
            },
        });
    });
}

function getEditFormForPersonalOrAvailabilityRequest(id) {
    return new Promise((resolve) => {
        $.ajax({
            method: 'POST',
            url: `get_edit_form_availability/${id}`,
            success: function (schedule) {
                resolve(schedule);
            },
        });
    });
}

function updatePersonalOrAvailabilityRequest(id, data) {
    return new Promise((resolve) => {
        $.ajax({
            method: 'PUT',
            data,
            url: `coach_schedule/${id}`,
            success: function (schedule) {
                resolve(schedule);
            },
        });
    });
}

function deleteAvailabilityRequest(id) {
    return new Promise((resolve) => {
        $.ajax({
            method: 'DELETE',
            url: `coach_schedule/${id}`,
            success: function (schedule) {
                resolve(schedule);
            },
        });
    });
}

function generateLinkForGoogleCalendarRequest() {
    return new Promise((resolve) => {
        $.ajax({
            method: 'POST',
            url: `generate_url_to_get_ics_file`,
            success: function (schedule) {
                resolve(schedule);
            },
        });
    });
}