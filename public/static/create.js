// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
	"use strict";

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	const forms = document.getElementsByClassName("needs-validation");

	// Loop over them and prevent submission
	Array.from(forms).forEach((form) => {
		form.addEventListener(
			"submit",
			(event) => {
				console.log("SUBMITTING");
				console.log(form.checkValidity());
				if (!form.checkValidity()) {
					event.preventDefault();
					event.stopPropagation();
				}

				form.classList.add("was-validated");
			},
			false
		);
		form.querySelectorAll(".slug-validate").forEach((element) => {
            let timeout;
			element.addEventListener("input", () => {
                clearTimeout(timeout);
				if (element.value.match(/^[a-z0-9-]+$/)) {
					element.setCustomValidity("");
				} else {
					element.setCustomValidity("Invalid slug");
				}
			});
		});
	});
})();
