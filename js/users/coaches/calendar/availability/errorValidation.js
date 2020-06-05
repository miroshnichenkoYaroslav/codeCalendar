class ErrorValidation {
    noDaysSelectedErrorText                     = 'Please select one day on the calendar.';
    noTimeTypeSelectedErrorText                 = 'Please select available or not available for this entry.';
    noTimeSelectedErrorText                     = 'Please select a time (interval or all day).';
    inputIsEmptyErrorText                       = 'Please enter a value for the field.';
    startDateIsNotLessThanEndDateErrorText      = 'Start time can not be longer than start time';
    isNotPeriodTimeUniqueAmountAllGroupsText    = time => `In selected groups time - ${time} is already in use.`;
    isNotPeriodTimeUniqueText                   = time => `The selected time - ${time} is already in between.`;

    static isNotSelectedDays                    = 'isNotSelectedDays';
    static isNotSelectedTime                    = 'isNotSelectedTime';
    static isNotSelectedTypeOfTime              = 'isNotSelectedTypeOfTime';
    static inputIsEmpty                         = 'inputIsEmpty';
    static startDateIsNotLessThanEndDate        = 'startDateIsNotLessThanEndDate';
    static isNotPeriodTimeUniqueAmountAllGroups = 'isNotPeriodTimeUniqueAmountAllGroups';
    static isNotPeriodTimeUnique                = 'isNotPeriodTimeUnique';

    /**
     * Creation and processing of errors by its type.
     *
     * @param {string} typeOfError  - Type of error received.
     * @param {object} params       - Additional parameters.
     */
    constructor(typeOfError, params = []) {
        switch (typeOfError) {
            case ErrorValidation.isNotSelectedDays:
                this.isNotSelectedDays();
                break;
            case ErrorValidation.isNotSelectedTime:
                this.isNotSelectedTime();
                break;
            case ErrorValidation.isNotSelectedTypeOfTime:
                this.isNotSelectedTypeOfTime();
                break;
            case ErrorValidation.inputIsEmpty:
                this.inputIsEmpty(params);
                break;
            case ErrorValidation.startDateIsNotLessThanEndDate:
                this.startDateIsNotLessThanEndDate(params);
                break;
            case ErrorValidation.isNotPeriodTimeUnique:
                this.isNotPeriodTimeUnique(params);
                break;
            case ErrorValidation.isNotPeriodTimeUniqueAmountAllGroups:
                this.isNotPeriodTimeUniqueAmountAllGroups(params);
                break;
            default:
                this.notMatchForTypeOfError(typeOfError);
        }
    }

    isNotSelectedDays () {
        alert(this.noDaysSelectedErrorText);
    }

    isNotSelectedTime() {
        alert(this.noTimeSelectedErrorText);
    }

    isNotSelectedTypeOfTime() {
        alert(this.noTimeTypeSelectedErrorText);
    }

    inputIsEmpty(params) {
        alert(this.inputIsEmptyErrorText);

        this.addErrorClassForBlockAtTime(params.element);
    }

    startDateIsNotLessThanEndDate(params) {
        alert(this.startDateIsNotLessThanEndDateErrorText);

        this.addErrorClassForBlockAtTime(params.elements.timeStartBlock);
        this.addErrorClassForBlockAtTime(params.elements.timeEndBlock);
    }

    addErrorClassForBlockAtTime (element) {
        $(element).addClass(errorInputNameOfClass);
        setTimeout(function () {
            $(element).removeClass(errorInputNameOfClass);
        }, 2000);
    }

    isNotPeriodTimeUnique(params) {
        const element = params.element;
        const value = element.val();
        alert(this.isNotPeriodTimeUniqueText(value));
        this.addErrorClassForBlockAtTime(element);
    }

    isNotPeriodTimeUniqueAmountAllGroups(params) {
        const element = params.element;
        if (element.attr('type') === 'checkbox') {
            alert(this.isNotPeriodTimeUniqueAmountAllGroupsText('All Day'));
        } else {
            const time = element.val();
            alert(this.isNotPeriodTimeUniqueAmountAllGroupsText(time));
        }

        this.addErrorClassForBlockAtTime(element);
    }

    notMatchForTypeOfError(typeOfError) {
        throw new Error(`No match for type of error - ${typeOfError}`);
    }
}