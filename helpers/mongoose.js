module.exports = {
  // create an array of error from mongoose error
  normalizeErrors: function(errors) {
    const normalizeErrors = [];
    for (let property in errors) {
      if (errors.hasOwnProperty(property)) {
        normalizeErrors.push(
          {
            title: property,
            message: errors[property].message,
            // detail: errors[property]
            kind: errors[property].kind,
            value: errors[property].value
          }
        );
      }
    }

    return normalizeErrors;
  }
};
