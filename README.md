# paperfit.js

Build HTML Templates ready for PDF conversion using [paperfit](https://github.com/dokufy/paperfit).

#

This library provides helper functions that facilitates the proper configuration of an HTML template for PDF conversion.<br />
Using this library to generate PDFs with [paperfit](https://github.com/dokufy/paperfit) is not strictly necessary but is highly recommended. paperfit makes input variables available in `window.__PAPERFIT_INPUT__`.

## Getting started

### Installation

    npm install --save-dev paperfit.js

## Usage

### Javascript

    import global from 'paperfit.js';

    // Define an object representing default values (optional)
    // const defaultUserInput: UserInput = {
    //    name: "John Doe",
    //    age: 30,
    //    isActive: true,
    // };

    // Set default input values (optional)
    // setPaperfitDefaultInput(userInput);

    // Later, retrieve the input values passed by paperfit using the getPaperfitInput function
    const input = getPaperfitInput<UserInput>();
    console.log(input);

### Typescript

    import global from 'paperfit.js'

    // Define an interface
    interface UserInput {
        name: string;
        age: number;
        isActive: boolean;
    }

    // Define an object representing default values matching the UserInput interface (optional)
    // const defaultUserInput: UserInput = {
    //    name: "John Doe",
    //    age: 30,
    //    isActive: true,
    // };

    // Set default input values (optional)
    // setPaperfitDefaultInput(defaultUserInput);

    // Later, retrieve the input values passed by paperfit using the getPaperfitInput function
    const input = getPaperfitInput<UserInput>();
    console.log(input);
