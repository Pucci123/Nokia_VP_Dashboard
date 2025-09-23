(function ($) {
    var forms = $('.wpcf7-form');

    forms.each(function () {
        var $this = $(this);
        var formId = $this.find('input[name="_wpcf7"]').val();
        var zip_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_zip').attr('zip_auto_complete');
        var city_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_city').attr('city_auto_complete');
        var state_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_state').attr('state_auto_complete');
        var country_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_country_dropdown').attr('country_auto_complete');

        // Show the preloader
        function showPreloader() {
            $('#preloader').show();
        }

        // Hide the preloader
        function hidePreloader() {
            $('#preloader').hide();
        }

        if (country_auto_complete || state_auto_complete || city_auto_complete || zip_auto_complete) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    console.log(position);
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    fetchAddressFromCoordinates(latitude, longitude);
                });
            } else {
                console.log("Geolocation is not available.");
            }
        }

        function fetchAddressFromCoordinates(latitude, longitude) {
            var apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

            showPreloader(); // Show preloader before making the API call

            $.ajax({
                url: apiUrl,
                dataType: "json",
                success: function (data) {
                    var countryCode = data.address.country_code.toUpperCase();
                    var country = data.address.country;
                    var state = data.address.state;
                    var city = data.address.city;
                    var zip = data.address.postcode;

                    // Use CountrySelect.js to set the country and force UI update
                    var countryDropdown = $('.uacf7-form-' + formId).find('.uacf7_country_dropdown_with_flag[country_auto_complete="true"]');
                    if (countryDropdown.length > 0) {
                        countryDropdown.countrySelect("selectCountry", countryCode);

                        // Force UI refresh after setting the country
                        setTimeout(function () {
                            countryDropdown.blur().focus();
                        }, 50);
                    } else {
                        $('.uacf7-form-' + formId).find('.wpcf7-uacf7_country_dropdown[country_auto_complete="true"]').val(country).trigger("change");
                    }

                    // State auto complete
                    var stateField = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_state[state_auto_complete="true"]');
                    if (stateField.length > 0) {
                        setTimeout(function () {
                            stateField.val(state).trigger("change");
                        }, 50);
                    }

                    // City auto complete
                    var cityField = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_city[city_auto_complete="true"]');
                    if (cityField.length > 0) {
                        setTimeout(function () {
                            cityField.val(city).trigger("change");
                        }, 70);
                    }

                    // Zip auto complete
                    var zipField = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_zip[zip_auto_complete="true"]');
                    if (zipField.length > 0) {
                        setTimeout(function () {
                            zipField.val(zip);
                        }, 100);
                    }
                },
                error: function (error) {
                    console.error("Error fetching address:", error);
                },
                complete: function () {
                    hidePreloader(); // Hide preloader after the API call completes
                }
            });
        }
    });
})(jQuery);
