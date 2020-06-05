$('.update_schedule').click(function () {
    var id = $(this).data('time_id');
    var coachTimeRow = 'coach_time_row_' + id;

    var data = {
        '_token': $('input[name="_token"]').val(),
        'route': 'send_invitation_to_coach',
        'path': 'Users.postAjax',
        'studio_id': $('input[name="studio_id"]').val(),
        'coach_id': $('input[name="coach_id"]').val(),
        'coach_studio_times_start': $(`#${coachTimeRow} input[name="edit_coach_studio_times_start"]`).val(),
        'coach_studio_times_end': $(`#${coachTimeRow} input[name="edit_coach_studio_times_end"]`).val(),
        'coach_studio_time_start': $(`#${coachTimeRow} input[name="edit_coach_studio_time_start"]`).val(),
        'coach_studio_time_end': $(`#${coachTimeRow} input[name="edit_coach_studio_time_end"]`).val(),
        'book_all_day': $(`#${coachTimeRow} input[name="edit_book_all_day"]`).is(':checked'),
        'coach_studio_time_id': $(`#${coachTimeRow} input[name="coach_studio_time_id"]`).val(),
        'is_edit': true
    };

    $.ajax({
        url: ajaxUrl,
        type: 'POST',
        dataType: 'json',
        data: data,
        contentType: 'application/x-www-form-urlencoded',
        success: function (data) {
            if (data.data.status && data.data.status === 'success') {
                $('#schedule_dataTable tbody').html('').html(data.data.schedule);
                refreshBookedScheduleTime();
                $('#alert_success').html(data.data.message).css('display', 'block');
                setTimeout(function () {
                    $('#alert_success').hide(500);
                }, 5000);
            } else {
                eval(data.data.script);
            }
        }
    });
});

$('#remove_invitation_btn').click(function () {
    var data = {
        '_token': $('input[name="_token"]').val(),
        'route': 'schedule_studio_coach_time_remove',
        'path': 'Users.postAjax',
        'studio_id': $(this).data('studio_id'),
        'coach_id': $(this).data('coach_id'),
        'coach_studio_time_id': $(this).data('item'),
    };

    doAjax(ajaxUrl, data, false);
})

$('.close_btn').click(function () {
    refreshBookedScheduleTime();
});

function refreshBookedScheduleTime() {
    $('#booked_schedule_time').empty();
    var data = {
        '_token': $('form input[name="_token"]').val(),
        'route': 'get_booked_schedule_time',
        'path': 'Users.postAjax',
        'studio_id': $('input[name="studio_id"]').val(),
        'coach_id': $('input[name="coach_id"]').val(),
    };

    $.ajax({
        url: ajaxUrl,
        type: 'POST',
        dataType: 'json',
        data: data,
        contentType: 'application/x-www-form-urlencoded',
        success: function (data) {
            $('#booked_schedule_time').append(data.data);
        },
    });
}