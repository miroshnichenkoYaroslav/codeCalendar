/* -- Tables identifiers. -- */
const tables = ['#mon', '#tue', '#wed', '#thu', '#fri', '#sat', '#sun'];

/* -- Modal window identifier. -- */
const modalSchedule                 = '#modal-schedule';
const lessonModal                   = '#lesson_modal';
const studioInfoModal               = '#studio_info_modal';
const availabilityModalId           = '#modal-availability';
const availabilityScheduleBlock     = '#availability-schedule-block';

/* -- Blocks identifier in a modal window. -- */
const modalContentId                = '#modal-content-schedule';
const lessonModalContentId          = '#lesson_modal_content';
const studioInfoModalContentId      = '#studio_info_modal_content';
const availabilityModalContentId    = '#modal-dialog-availability-content';

/* -- Modal dialog schedule identifier. -- */
const modalDialogScheduleClass  = '.modal-dialog-schedule';
const lessonModalDialogClass    = '.lesson_modal_dialog';
const studioModalDialogClass    = '.studio_info_modal_dialog_schedule';

/* -- Short names of days. -- */
const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* -- Date output classes for each day. -- */
const dateClassForEachDay = {
    mon: { top: '.mon-date-top', bottom: '.mon-date-bottom' },
    tue: { top: '.tue-date-top', bottom: '.tue-date-bottom' },
    wed: { top: '.wed-date-top', bottom: '.wed-date-bottom' },
    thu: { top: '.thu-date-top', bottom: '.thu-date-bottom' },
    fri: { top: '.fri-date-top', bottom: '.fri-date-bottom' },
    sat: { top: '.sat-date-top', bottom: '.sat-date-bottom' },
    sun: { top: '.sun-date-top', bottom: '.sun-date-bottom' },
};

/* -- Common class of all schedule blocks. -- */
const scheduleBlockClass = '.schedule-block';

/* -- Common class of all schedule ignore blocks(which can not be selected). -- */
const scheduleBlockIgnoreClass = '.schedule-block-ignore';

/* -- Class td-body. -- */
const tdBody = '.td-body';

/* -- An error when the start time is longer than the end time. -- */
const timeFromShouldBeLessThanTimeTillErrorText = "'Time Till' should be > 'Time From'.";

/* -- Error filling out all required fields. -- */
const requiredFieldsErrorText = 'Please complete all required fields.';

/* -- Class set-availability. -- */
const setAvailability = '.set-availability';

/* -- Arrow to change weeks ago. -- */
const actionBack = '#action-back';

/* -- Arrow to change the week ahead. --*/
const actionForward = '#action-forward';

/** -- String with the class name of the selected day. -- */
const selectedDay = 'selected-day';

/** -- Selector with the class name of the selected day. -- */
const selectedDayClass = '.selected-day';

/** -- A string with the class name for a day that is not in the current month. -- */
const notCurrentMonth = 'not-current-month';

/** -- Class of the selected month for calendar navigation. -- */
const selectedMonthAvailability = '.selected-month-availability';

/** -- Class of the selected year for calendar navigation. -- */
const selectedYearAvailability = '.selected-year-availability';

/** -- Class of the main block of the schedule made to replace content. -- */
const scheduleDisplayMainBlock = '.schedule-main-block';

/* -- Block class that is above the schedule display. -- */
const blockOnTopOfScheduleDisplay = '.block-on-top-of-table';

/* -- Class of calendar of quick access to the necessary date. -- */
const quickAccessToDateCalendarClass = '.quick-access-to-date-calendar';

/* -- Id of the button for receiving a link for synchronization with google calendar. -- */
const linkMyCalendarId = '#link-my-calendar';