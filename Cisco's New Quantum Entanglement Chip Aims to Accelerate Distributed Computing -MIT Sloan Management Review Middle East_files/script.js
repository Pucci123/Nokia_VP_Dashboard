(function ($) {

    // Country function for load the signature
    function uacf7_country_load() {

        var forms = $('.wpcf7-form');

        forms.each(function () {
            var formId = $(this).find('input[name="_wpcf7"]').val();
            $('.uacf7-form-' + formId).find('input.uacf7_country_dropdown_with_flag').each(function () {
                var fieldId = jQuery(this).attr('id');
                var defaultCountry = jQuery(this).attr('country-code');
                var onlyCountries = jQuery(this).attr('only-countries');
                if (typeof onlyCountries !== "undefined" && onlyCountries != '') {
                    onlyCountries = JSON.parse(onlyCountries);
                } else {
                    onlyCountries = '';
                }
                $("#" + fieldId).countrySelect({
                    defaultCountry: defaultCountry,
                    onlyCountries: onlyCountries,
                    responsiveDropdown: true,
                    preferredCountries: []
                });
            });
        });
    }

    uacf7_country_load();

    // Recall the country function if repeater addon repeat
    $(document).on('click', '.uacf7_repeater_add', function () {
        uacf7_country_load();
        // var scriptId = 'uacf7-country-select-library-js';
        // var scriptSrc = $('#' + scriptId).attr('src');

        // // Remove the existing script tag
        // $('#' + scriptId).remove();

        // // Create a new script tag
        // var newScript = document.createElement('script');
        // newScript.id = scriptId;
        // newScript.src = scriptSrc;

        // // Append the new script tag to the head
        // $('head').append(newScript);

    });

})(jQuery);

