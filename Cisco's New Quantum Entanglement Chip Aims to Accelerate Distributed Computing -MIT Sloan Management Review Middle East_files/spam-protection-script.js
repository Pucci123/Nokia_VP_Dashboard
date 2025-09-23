(function ($) {

    $(window).on('load', function () {
        // Select all forms with class 'wpcf7-form'
        var forms = $('.wpcf7-form');
        // Iterate over each form
        forms.each(function () {
            var formId = $(this).find('input[name="_wpcf7"]').val();
            var uacf7_form = $('.uacf7-form-' + formId);
            var uacf7_mail = $(`.uacf7-form-${formId} input[type="email"]`);
            var uacf7_spam_protection = $('.uacf7-form-' + formId).find('.uacf7_spam_recognation');
            var form_submit_btn = uacf7_spam_protection.closest(`.uacf7-form-${formId}`).find('.wpcf7-submit');
            var uacf7_message = uacf7_spam_protection.closest(`.uacf7-form-${formId} input[type="textarea"]`).val();
            var user_ip = $(uacf7_spam_protection).attr('user-ip');
            var user_country = $(uacf7_spam_protection).attr('iso2');

            $.ajax({
                url: uacf7_spam_pro_obj.ajax_url,
                type: 'POST',
                data: {
                    action: 'uacf7_spam_action',
                    nonce: uacf7_spam_pro_obj.nonce,
                    form_id: formId
                },
                success: function (res) {
                    var uacf7_minimum_time_limit = (res.uacf7_minimum_time_limit && res.uacf7_minimum_time_limit.length > 0) ? res.uacf7_minimum_time_limit.split(',') : [];
                    var user_inpput_time = uacf7_minimum_time_limit * 1000;
                    //Time based submission Controls
                    var ipTimestamps = {};

                    var emailProtectionType = res.uacf7_spam_email_protection_type || 'none';
                    var allowedEmails       = res.uacf7_spam_email_protection_allow_list ? res.uacf7_spam_email_protection_allow_list.split(',').map(email => email.trim()) : [];
                    var deniedEmails        = res.uacf7_spam_email_protection_deny_list ? res.uacf7_spam_email_protection_deny_list.split(',').map(email => email.trim()) : [];

                    var isValid = true;
                    // Remove any existing click handlers to avoid duplication
                    // $(form_submit_btn).off('click');
                    uacf7_form.on('input', 'input[type="email"]', function () {
                        var email = $(this).val().trim();
                        var errorMessage = '';
                        if (emailProtectionType === 'allowlist' && allowedEmails.length > 0) {
                            if (!allowedEmails.includes(email)) {
                                errorMessage = uacf7_spam_pro_obj.emailValidationMessage;
                            }
                        } else if (emailProtectionType === 'denylist') {
                            if (deniedEmails.includes(email)) {
                                errorMessage = uacf7_spam_pro_obj.emailValidationMessage;
                            }
                        }

                        // Display error message if needed
                        if (errorMessage) {
                            $(this).next('.email-error').remove();
                            $(this).after(`<span class="email-error" style="color:red; font-size:12px;">${errorMessage}</span>`);
                        } else {
                            $(this).next('.email-error').remove();
                        }
                    });

                    
                    $(form_submit_btn).on('click', function (event) {
                        // Getting user input valeu
                        const userInput = uacf7_spam_protection.find('#rtn').val();
                        const userInputimg = uacf7_spam_protection.find("#userInput").val();
                        
                        //Returning Total Sum of Numbers
                        const first_number = parseInt(uacf7_spam_protection.find('#frn').text());
                        const second_number = parseInt(uacf7_spam_protection.find('#srn').text());

                        // Calculate the expected total
                        const total_number = first_number + second_number;

                        // If it's not empty, compare it with the expected value
                        const captcha = uacf7_spam_protection.find("#captcha").text();

                        // Captcha refresh button
                        var refreshButton = uacf7_spam_protection.find("#arithmathic_refresh");

                        // Email domain validation
                        if (emailProtectionType !== 'none') {
                            uacf7_mail.each(function () {
                                var email = $(this).val().trim();
                                if (email) {

                                    if (emailProtectionType === 'allowlist' && allowedEmails.length > 0) {
                                        if (!allowedEmails.includes(email)) {
                                            alert(uacf7_spam_pro_obj.emailValidationMessage);
                                            isValid = false;
                                            return false;
                                        }
                                    }

                                    if (emailProtectionType === 'denylist' && deniedEmails.includes(email)) {
                                        alert(uacf7_spam_pro_obj.emailValidationMessage);
                                        isValid = false;
                                        return false;
                                    }
                                }
                            });

                            if (!isValid) {
                                event.preventDefault();
                                isValid = true;
                                refreshButton.trigger('click');
                                return false;
                            }
                        }

                        // Select this form with class 'wpcf7-form'
                        var form = $(this).closest('.wpcf7-form');

                        // Check if all required fields are filled
                        var required_fields = form.find('.wpcf7-validates-as-required');
                        var all_filled = true;

                        required_fields.each(function () {
                            if ($(this).val().trim() === '') {
                                all_filled = false;
                                return false; // Break the loop if a required field is empty
                            }
                        });

                        if (!all_filled) {
                            alert(uacf7_spam_pro_obj.fieldsRequiredMessage);
                            event.preventDefault(); // Prevent form submission
                            return false;
                        }

                        // Check if userInput is empty
                        if (typeof userInput !== 'undefined' && userInput.trim() !== '') {
                            const userInputInt = parseInt(userInput.trim());
                            if (isNaN(userInputInt) || userInputInt !== total_number) {
                                event.preventDefault(); // Prevent form submission
                                return false; // Stop further execution
                            }
                        } else if (typeof userInput !== 'undefined' && userInput.trim() === '') {
                            event.preventDefault();
                            return false; // Break the loop if a required field is empty
                        }

                        if (typeof userInputimg !== 'undefined' && userInputimg.trim() !== '') {
                            if (userInputimg !== captcha) {
                                event.preventDefault();
                                return false; // Break the loop if a required field is empty
                            }
                        } else if (typeof userInputimg !== 'undefined' && userInputimg.trim() === '') {
                            event.preventDefault();
                            return false;
                        }

                        // Spam protection logic
                        var formSubmitTime = new Date().getTime();
                        var lastSubmitTime = ipTimestamps[user_ip] || 0;
                        var timeTaken      = formSubmitTime - lastSubmitTime;
                        var remainingTime  = (user_inpput_time - timeTaken) / 1000;

                        if (timeTaken < user_inpput_time) {
                            alert(uacf7_spam_pro_obj.tooFastMessage.replace('%s', remainingTime.toFixed(0)));
                            event.preventDefault();
                            return false;
                        }

                        ipTimestamps[user_ip] = formSubmitTime;
                        refreshButton.trigger('click');
                        // If all checks pass, allow form submission
                        return true;

                    });

                },
                error: function (xhr, status, error) {
                    console.error("Error fetching form spam protection data:", error);
                },
            });

        });
    });

})(jQuery);

