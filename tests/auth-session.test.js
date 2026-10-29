'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const authController = require('../controllers/authController');
const studentModel = require('../models/studentModel');

function makeResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('student session lookup resolves the current profile for the logged-in registration number', async () => {
  const res = makeResponse();
  const originalFindByRegistration = studentModel.findByRegistration;
  studentModel.findByRegistration = async (registrationNumber) => {
    assert.equal(registrationNumber, 'STO1-001A');
    return {
      registration_number: registrationNumber,
      name: 'Ada Lovelace',
      profile_photo_url: null
    };
  };

  try {
    await authController.me({
      session: {
        registrationNumber: 'STO1-001A',
        studentName: 'Ada Lovelace'
      }
    }, res, (error) => {
      throw error;
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      registration_number: 'STO1-001A',
      name: 'Ada Lovelace',
      profile_photo_url: null
    });
  } finally {
    studentModel.findByRegistration = originalFindByRegistration;
  }
});
