// client/src/pages/Register/Step1Details.jsx - UPDATED VOLUNTEER FORM
import React, { useState, useEffect } from 'react';
//import moment from 'moment';

const Step1Details = ({ formData, setFormData, onNext, isLoading }) => {
  const [errors, setErrors] = useState({});
  const [age, setAge] = useState(null);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (!isNaN(dob)) {
        const age = calculateAge(dob);
        setAge(age);
        setFormData(prev => ({ ...prev, age }));
      }
    }
  }, [formData.dateOfBirth]);

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLanguageChange = (language, skill) => {
    setFormData(prev => ({
      ...prev,
      languages: {
        ...prev.languages,
        [language]: {
          ...prev.languages?.[language],
          [skill]: !prev.languages?.[language]?.[skill]
        }
      }
    }));
  };

  const handleOtherLanguageNameChange = (e) => {
  const value = e.target.value;
  setFormData(prev => ({
    ...prev,
    languages: {
      ...prev.languages,
      other: {
        ...prev.languages?.other,
        name: value,
        read: prev.languages?.other?.read || false,
        write: prev.languages?.other?.write || false,
        speak: prev.languages?.other?.speak || false,
        understand: prev.languages?.other?.understand || false
      }
    }
  }));
};

  const handleDocumentSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, idProofType: selected }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields validation
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus',
      'stateOfOrigin', 'localGovernment', 'city', 'residentialAddress',
      'phone', 'emergencyContactName', 'emergencyContactPhone',
      'dietaryHabit', 'education', 'occupation'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Phone validation
    if (formData.phone && !/^0[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must start with 0 and be 11 digits';
    }

    // Emergency phone validation
    if (formData.emergencyContactPhone && !/^0[0-9]{10}$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Phone must start with 0 and be 11 digits';
    }

    // Age validation
    if (age !== null && age < 18) {
      newErrors.dateOfBirth = 'Volunteer must be at least 18 years old';
    }

    // Languages validation - at least one language with at least one skill
    const hasLanguageSkill = Object.values(formData.languages || {}).some(
      lang => lang.read || lang.write || lang.speak || lang.understand
    );
    if (!hasLanguageSkill) {
      newErrors.languages = 'At least one language skill is required';
    }

    // Documents validation
    if (!formData.idProofType || formData.idProofType.length === 0) {
      newErrors.idProofType = 'At least one ID proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  // Language options
  const languages = ['english', 'hindi', 'german', 'french'];
  const skills = ['read', 'write', 'speak', 'understand'];

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {/* Volunteer ID & Initials - Auto-generated */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vol. Reg. No.</label>
            <input
              type="text"
              value={formData.volunteerId || 'Auto-generated'}
              disabled
              className="input-field bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Volunteer's Initials</label>
            <input
              type="text"
              value={formData.initials || 'Auto-generated'}
              disabled
              className="input-field bg-gray-100"
            />
          </div>
          <div>
  <label className="block text-sm font-medium text-gray-700">
    Profile Photo <span className="text-red-500">*</span>
  </label>
  <input
    type="file"
    accept=".jpg,.jpeg,.png,.webp"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file && file.size <= 5 * 1024 * 1024) {
        setFormData(prev => ({ ...prev, profilePhoto: file }));
      }
    }}
    className="input-field"
  />
  <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP · Max 5MB</p>
</div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="e.g. RAJ"
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. KARAN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="e.g. SAHU"
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
                className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age (Years)</label>
              <input
                type="text"
                value={age !== null ? age : 'Auto-calculated'}
                disabled
                className="input-field bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className={`input-field ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="maritalStatus"
                  value="Unmarried"
                  checked={formData.maritalStatus === 'Unmarried'}
                  onChange={handleChange}
                />
                Unmarried
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="maritalStatus"
                  value="Married"
                  checked={formData.maritalStatus === 'Married'}
                  onChange={handleChange}
                />
                Married
              </label>
            </div>
            {errors.maritalStatus && <p className="text-red-500 text-sm mt-1">{errors.maritalStatus}</p>}
          </div>
        </div>

        {/* Location Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State of Origin <span className="text-red-500">*</span>
              </label>
              <select
                name="stateOfOrigin"
                value={formData.stateOfOrigin || ''}
                onChange={handleChange}
                className={`input-field ${errors.stateOfOrigin ? 'border-red-500' : ''}`}
              >
                <option value="">Select State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
<option value="Arunachal Pradesh">Arunachal Pradesh</option>
<option value="Assam">Assam</option>
<option value="Bihar">Bihar</option>
<option value="Chhattisgarh">Chhattisgarh</option>
<option value="Goa">Goa</option>
<option value="Gujarat">Gujarat</option>
<option value="Haryana">Haryana</option>
<option value="Himachal Pradesh">Himachal Pradesh</option>
<option value="Jharkhand">Jharkhand</option>
<option value="Karnataka">Karnataka</option>
<option value="Kerala">Kerala</option>
<option value="Madhya Pradesh">Madhya Pradesh</option>
<option value="Maharashtra">Maharashtra</option>
<option value="Manipur">Manipur</option>
<option value="Meghalaya">Meghalaya</option>
<option value="Mizoram">Mizoram</option>
<option value="Nagaland">Nagaland</option>
<option value="Odisha">Odisha</option>
<option value="Punjab">Punjab</option>
<option value="Rajasthan">Rajasthan</option>
<option value="Sikkim">Sikkim</option>
<option value="Tamil Nadu">Tamil Nadu</option>
<option value="Telangana">Telangana</option>
<option value="Tripura">Tripura</option>
<option value="Uttar Pradesh">Uttar Pradesh</option>
<option value="Uttarakhand">Uttarakhand</option>
<option value="West Bengal">West Bengal</option>
              </select>
              {errors.stateOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.stateOfOrigin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Government <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="localGovernment"
                value={formData.localGovernment || ''}
                onChange={handleChange}
                className={`input-field ${errors.localGovernment ? 'border-red-500' : ''}`}
                placeholder="Enter LGA"
              />
              {errors.localGovernment && <p className="text-red-500 text-sm mt-1">{errors.localGovernment}</p>}
            </div>
          </div>
          <div className="mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residential Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="residentialAddress"
                value={formData.residentialAddress || ''}
                onChange={handleChange}
                className={`input-field ${errors.residentialAddress ? 'border-red-500' : ''}`}
                rows="3"
                placeholder="Enter full residential address"
              />
              {errors.residentialAddress && <p className="text-red-500 text-sm mt-1">{errors.residentialAddress}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact No. of Volunteer <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="e.g. 08012345678"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Contact No.</label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 08098765432"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName || ''}
                onChange={handleChange}
                className={`input-field ${errors.emergencyContactName ? 'border-red-500' : ''}`}
                placeholder="Emergency contact name"
              />
              {errors.emergencyContactName && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact No. <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone || ''}
                onChange={handleChange}
                className={`input-field ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
                placeholder="e.g. 08087654321"
              />
              {errors.emergencyContactPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone}</p>}
            </div>
          </div>
        </div>

        {/* Languages */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Languages <span className="text-red-500">*</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Language</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Read</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Write</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Speak</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Understand</th>
                </tr>
              </thead>
              <tbody>
                {languages.map(lang => (
                  <tr key={lang} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm capitalize">{lang}</td>
                    {skills.map(skill => (
                      <td key={skill} className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={formData.languages?.[lang]?.[skill] || false}
                          onChange={() => handleLanguageChange(lang, skill)}
                          className="h-4 w-4 text-biomed-green"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-gray-200">
  <td className="px-4 py-2">
    <input
      type="text"
      placeholder="Other language"
      className="input-field text-sm"
      value={formData.languages?.other?.name || ''}
      onChange={handleOtherLanguageNameChange}
    />
  </td>
  {skills.map(skill => (
    <td key={skill} className="px-4 py-2 text-center">
      <input
        type="checkbox"
        checked={formData.languages?.other?.[skill] || false}
        onChange={() => handleLanguageChange('other', skill)}
        className="h-4 w-4 text-biomed-green"
      />
    </td>
  ))}
</tr>
              </tbody>
            </table>
                    </div>
          {errors.languages && <p className="text-red-500 text-sm mt-2">{errors.languages}</p>}
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Language Notes</label>
            <textarea
              name="languageNotes"
              value={formData.languageNotes || ''}
              onChange={handleChange}
              className="input-field"
              rows="2"
              placeholder="Optional notes on language proficiency or remarks"
            />
          </div>
        </div>

        {/* Dietary Habits */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dietary Habits <span className="text-red-500">*</span>
          </h3>
          <div className="flex gap-6">
            {['Vegetarian', 'Non-Vegetarian', 'Both'].map(option => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dietaryHabit"
                  value={option}
                  checked={formData.dietaryHabit === option}
                  onChange={handleChange}
                />
                {option}
              </label>
            ))}
          </div>
          {errors.dietaryHabit && <p className="text-red-500 text-sm mt-1">{errors.dietaryHabit}</p>}
        </div>

        {/* Documents Submitted */}
        <div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Documents Submitted for Age / ID Proof <span className="text-red-500">*</span>
  </h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[
      'Driving License', 'Voters ID Card', 'NIN',
      'Organization ID-Card', 'School Leaving Certificate',
      'Passport', 'Election Card', 'Others'
    ].map(option => (
      <label key={option} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          name="idProofType"
          value={option}
          checked={formData.idProofType?.includes(option) || false}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => {
              const current = prev.idProofType || [];
              if (current.includes(value)) {
                return { ...prev, idProofType: current.filter(item => item !== value) };
              } else {
                return { ...prev, idProofType: [...current, value] };
              }
            });
          }}
          className="h-4 w-4 text-biomed-green"
        />
        <span className="text-sm">{option}</span>
      </label>
    ))}
  </div>
  {errors.idProofType && <p className="text-red-500 text-sm mt-1">{errors.idProofType}</p>}
</div>

        {/* Upload Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Documents <span className="text-red-500">*</span>
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
                setFormData(prev => ({
                  ...prev,
                  documents: validFiles
                }));
              }}
              className="hidden"
              id="documentUpload"
            />
            <label htmlFor="documentUpload" className="cursor-pointer">
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2">Click to select files</p>
                <p className="text-xs text-gray-500 mt-1">PDF, Word, JPEG, PNG, GIF, WebP — max 10 MB per file</p>
              </div>
            </label>
          </div>
          {formData.documents && formData.documents.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-600">{formData.documents.length} file(s) selected</p>
            </div>
          )}
        </div>

        {/* Education & Occupation */}
<div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Education & Occupation</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    
    {/* Education - Left Column */}
    <div>
      <h4 className="text-md font-semibold text-gray-900 mb-3">
        Education <span className="text-red-500">*</span>
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {[
          'Primary', 'JSS', 'SSS', 'Graduation',
          'Illiterate', 'University', 'PG', 'Other'
        ].map(option => (
          <label key={option} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              value={option}
              checked={formData.education?.includes(option) || false}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => {
                  const current = prev.education || [];
                  if (current.includes(value)) {
                    return { ...prev, education: current.filter(item => item !== value) };
                  } else {
                    return { ...prev, education: [...current, value] };
                  }
                });
              }}
              className="h-4 w-4 text-biomed-green focus:ring-biomed-green"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
    </div>

    {/* Occupation - Right Column */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Occupation <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="occupation"
        value={formData.occupation || ''}
        onChange={handleChange}
        className={`input-field ${errors.occupation ? 'border-red-500' : ''}`}
        placeholder="Describe the volunteer's occupation"
      />
      {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
    </div>
  </div>
</div>


        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks || ''}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="Any additional remarks or notes"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            'Next: Biometric Setup →'
          )}
        </button>
      </div>
    </div>
  );
};

export default Step1Details;