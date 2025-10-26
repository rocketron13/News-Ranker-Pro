import {validate} from 'uuid';


// Checks player id
function checkId(id) {
    if (id === undefined) throw new Error(`Id cannot be empty.`);
    if (typeof id !== 'string') throw new Error(`Id must be a string.`);
    id = id.trim();
    if (id.length === 0) throw new Error(`Id cannot be an empty string.`);
    if (!validate(id)) throw new Error(`Id must be a valid UUID.`);
    return id;
}

// Verifies that a string input is non-empty string, and returns the trimmed string
function checkString(str, str_name) {
    if (str === undefined) throw new Error(`${str_name} cannot be empty.`);
    if (typeof str !== "string") throw new Error(`${str_name} must be a string.`);
    if (str.trim().length === 0) throw new Error(`${str_name} cannot be just spaces.`);
    return str.trim();
}

// Verifies the username provided is valid
function checkUsername(username) {
    if (username === undefined) throw new Error(`Username cannot be empty.`);
    if (typeof username !== 'string') throw new Error(`Username must be a string.`);
    username = username.trim();
    if (username.length === 0) throw new Error(`Username cannot be an empty string.`);
    if (username.length > 50) throw new Error(`Username can have no more than 50 characters.`);
    for (let i = 0; i < username.length; i++) {
        if (!('a' <= username[i] && username[i] <= 'z') && !('A' <= username[i] && username[i] <= 'Z') && !('0' <= username[i] && username[i] <= '9'))
            throw new Error(`Username can only contain letters and numbers.`);
    }
    return username;
}

// Verifies that an email is of the form "***@stevens.edu"
function checkEmail(email) {
    if (email === undefined) throw new Error('Email cannot be blank.');
    if (typeof email !== 'string') throw new Error('Email must be a string.');
    email = email.trim();
    if (email.length === 0) throw new Error('Email cannot be an empty string.');
    if (email.length > 256) throw new Error('Email must be less than 256 characters.');
    // Regex help source: https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regex.test(email)) throw new Error('Invalid email format.');
    return email;
}

// Verifies that a password is valid: must have at least 12 characters, one uppercase letter, one lowercase letter, one number, and one symbol
function checkPassword(password) {
    if (password === undefined) throw new Error('Password cannot be empty.');
    if (typeof password !== 'string') throw new Error('Password must be a string.');
    password = password.trim()
    if (password.length === 0) throw new Error('Password cannot be an empty string.');
    if (password.length < 12) throw new Error('Password must have at least 12 characters.');
    let uppercaseFound = false;
    let lowercaseFound = false;
    let numberFound = false;
    let symbolFound = false;
    for (let i = 0; i < password.length; i++) {
        if ('0' <= password[i] && password[i] <= '9') numberFound = true;
        if ('a' <= password[i] && password[i] <= 'z') lowercaseFound = true;
        if ('A' <= password[i] && password[i] <= 'Z') uppercaseFound = true;
        if (/[^a-zA-Z0-9\s]/.test(password[i])) symbolFound = true;
    }
    if (!uppercaseFound || !lowercaseFound || !numberFound || !symbolFound) throw new Error('Password must contain at least one lowercase letter, uppercase letter, number, and symbol.');
    return password;
}

// Verifies that 'name' is a string with no numbers and returns the trimed version of it
function checkName(name, str_name) {
    if (name === undefined) throw new Error(`${str_name} cannot be empty.`);
    if (typeof name !== 'string') throw new Error(`${str_name} must be a string.`);
    name = name.trim();
    if (name.length === 0) throw new Error(`${str_name} cannot be an empty string.`);
    for (let i = 0; i < name.length; i++) if (name[i] !== ' ' && !isNaN(name[i])) throw new Error(`Error in ${func_name}: ${str_name} cannot contain numbers.`);
    return name;
}

// Verify the person's email using 'nodemailer' package
const sendVerificationEmail = async (id) => {
    // Initalize SendGrid with API key from .env
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    id = checkId(id);
    let user = await userData.getUserById(id);
    let token = user.verificationToken;
    let email = user.email;

    const url = `http://localhost:3000/users/verifyEmail?token=${token._id}`;
    const emailInformation = {
        from: process.env.VERIFICATION_EMAIL,
        to: email,
        subject: 'EatWithMe Email Verification',
        text: `Please clink the following link to verify your email: ${url}`,
        html: `<p><a href="${url}">Verify Email</a></p>`,
        // Disable sendGrid API's link encoding so the simple link is sent
        trackingSettings: {
            clickTracking: {
                enable: false,
                enableText: false
            }
        }
    };
    // Send the verification email
    try {
        await sgMail.send(emailInformation);
    } catch (e) {
        throw new Error('Error sending verification email.');
    }
}


export default {
    checkId,
    checkString,
    checkUsername,
    checkEmail,
    checkPassword,
    checkName,
    sendVerificationEmail
}