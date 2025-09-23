(function ($) {
    var forms = $('.wpcf7-form');

    forms.each(function () {
        var $this = $(this);
        var formId = $this.find('input[name="_wpcf7"]').val();
        const countrySelect = $('.uacf7-form-' + formId).find('.uacf7_country_api');
        const stateSelect = $('.uacf7-form-' + formId).find('#uacf7_state_api');
        const citySelect = $('.uacf7-form-' + formId).find('#uacf7_city_api');

        var country_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_country_dropdown').attr('country_auto_complete');
        var state_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_state').attr('state_auto_complete');
        var city_auto_complete = $('.uacf7-form-' + formId).find('.wpcf7-uacf7_city').attr('city_auto_complete');
        const ds_country = $('.uacf7-form-' + formId).find('.uacf7_country_api').attr('ds_country');
        const ds_state = $('.uacf7-form-' + formId).find('#uacf7_state_api').attr('ds_state');
        const ds_city = $('.uacf7-form-' + formId).find('#uacf7_city_api').attr('ds_city');
        const only_countries_attr = $('.uacf7-form-' + formId).find('.uacf7_country_api').attr('only-countries');
        const apiUrlCountries = all_country_script.plugin_dir_url + "/inc/data.json";
        const all_countries_iso2_array = [];
        const only_countries = $('.uacf7-form-' + formId).find('.uacf7_country_api').attr('only-countries');
        const default_country = $('.uacf7-form-' + formId).find('.uacf7_country_api').attr('country-code');

        // Show the preloader
        function showPreloader() {
            $('#preloader').show();
        }

        // Hide the preloader
        function hidePreloader() {
            $('#preloader').hide();
        }

        // Fetching Only Selected Countries
        function only_countries_loading() {
            showPreloader(); // Show preloader before making the API call
            fetch(apiUrlCountries)
                .then(response => response.json())
                .then(data => {
                    const countries = data;
                    var country_with_iso2 = [];
                    countries.forEach(country => {
                        country_with_iso2.push(`${country.iso2}`);
                    });

                    var iso2 = country_with_iso2.map(element => element.toLowerCase());
                    all_countries_iso2_array.push(iso2);

                    var common_countries = all_countries_iso2_array[0].filter(value => only_countries.includes(value));

                    for (const value of common_countries) {
                        countries.forEach(item => {
                            var iso2_single = item.iso2.toLowerCase();
                            if (iso2_single === value) {
                                const option = document.createElement('option');
                                option.value = item.name;
                                option.textContent = item.name;
                                countrySelect.append(option);
                            }
                        });
                    }
                })
                .finally(() => {
                    hidePreloader(); // Hide preloader after the API call completes
                });
        }

        // Fetching All Countries
        function all_countries_loading() {
            showPreloader(); // Show preloader before making the API call
            fetch(apiUrlCountries)
                .then(response => response.json())
                .then(data => {
                    const countries = data;
                    countries.forEach(country => {
                        const country_with_iso2 = country.iso2.toLowerCase();
                        const option = document.createElement('option');
                        // Loading default country
                        if (country_with_iso2 === default_country) {
                            option.value = country.name;
                            option.textContent = country.name;
                            option.selected = true;
                            countrySelect.append(option);

                            // Loading Selected Country States
                            fetch(apiUrlCountries)
                                .then(response => response.json())
                                .then(data => {
                                    const statesData = data;
                                    const selectedCountryData = statesData.find(country_ele => country_ele.name === country.name);

                                    if (selectedCountryData) {
                                        for (var state of selectedCountryData.states) {
                                            const option = document.createElement('option');
                                            option.value = state.name;
                                            option.textContent = state.name;
                                            stateSelect.append(option);
                                        }
                                    }
                                });
                        } else {
                            option.value = country.name;
                            option.textContent = country.name;
                            countrySelect.append(option);
                        }
                    });
                })
                .finally(() => {
                    hidePreloader(); // Hide preloader after the API call completes
                });
        }

        // If default country selected
        if (ds_country) {
            if (only_countries_attr === '[]') {
                all_countries_loading();
            } else {
                only_countries_loading();
            }
        }

        // Fetch states when a country is selected
        if (ds_state) {
            countrySelect.change(function () {
                stateSelect.html('');
                citySelect.html('');
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a State';
                stateSelect.prepend(defaultOption);
                const selectedCountry = countrySelect.val().split(' (')[0].trim();

                showPreloader(); // Show preloader before making the API call
                fetch(apiUrlCountries)
                    .then(response => response.json())
                    .then(data => {
                        const statesData = data;
                        const selectedCountryData = statesData.find(country => country.name === selectedCountry);
                        if (selectedCountryData) {
                            for (var state of selectedCountryData.states) {
                                const option = document.createElement('option');
                                option.value = state.name;
                                option.textContent = state.name;
                                stateSelect.append(option);
                            }
                        }
                    })
                    .finally(() => {
                        hidePreloader(); // Hide preloader after the API call completes
                    });
            });
        }

        // Fetch cities when a state is selected
        if (ds_city) {
            stateSelect.change(function () {
                citySelect.html('');
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a city';
                citySelect.prepend(defaultOption);
                const selectedState = stateSelect.val();

                showPreloader(); // Show preloader before making the API call
                fetch(apiUrlCountries)
                    .then(response => response.json())
                    .then(data => {
                        const citiesData = data;
                        for (const country of citiesData) {
                            for (const state of country.states) {
                                const target_state = selectedState;
                                if (state.name === target_state) {
                                    if (state.cities && state.cities.length > 0) {
                                        for (const city of state.cities) {
                                            const option = document.createElement('option');
                                            option.value = city.name;
                                            option.textContent = city.name;
                                            citySelect.append(option);
                                        }
                                    } else {
                                        const defaultOption = document.createElement('option');
                                        defaultOption.textContent = 'This state doesn\'t have cities. Please confirm the selected country.';
                                        defaultOption.disabled = true; // Optional: disable this option
                                        citySelect.append(defaultOption);
                                    }
                                    break;
                                }
                            }
                        }
                    })
                    .finally(() => {
                        hidePreloader(); // Hide preloader after the API call completes
                    });
            });
        }
    });
})(jQuery);
