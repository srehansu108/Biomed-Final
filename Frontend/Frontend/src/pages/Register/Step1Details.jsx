// client/src/pages/Register/Step1Details.jsx - COMPLETE VOLUNTEER FORM
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isValid } from 'date-fns';

// ============================================
// NIGERIA DATA
// ============================================
const NIGERIA_DATA = {
  states: [
    { name: 'Abia', lgas: ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikawuno', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'] },
    { name: 'Adamawa', lgas: ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'] },
    { name: 'Akwa Ibom', lgas: ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'] },
    { name: 'Anambra', lgas: ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'] },
    { name: 'Bauchi', lgas: ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'] },
    { name: 'Bayelsa', lgas: ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'] },
    { name: 'Benue', lgas: ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'] },
    { name: 'Borno', lgas: ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'] },
    { name: 'Cross River', lgas: ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'] },
    { name: 'Delta', lgas: ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'] },
    { name: 'Ebonyi', lgas: ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'] },
    { name: 'Edo', lgas: ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'] },
    { name: 'Ekiti', lgas: ['Ado-Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido-Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'] },
    { name: 'Enugu', lgas: ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo-Uwani'] },
    { name: 'FCT (Abuja)', lgas: ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'] },
    { name: 'Gombe', lgas: ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'] },
    { name: 'Imo', lgas: ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'] },
    { name: 'Jigawa', lgas: ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Kaugama', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'] },
    { name: 'Kaduna', lgas: ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'] },
    { name: 'Kano', lgas: ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'] },
    { name: 'Katsina', lgas: ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dan Musa', 'Dandume', 'Danja', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'] },
    { name: 'Kebbi', lgas: ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'] },
    { name: 'Kogi', lgas: ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'] },
    { name: 'Kwara', lgas: ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'] },
    { name: 'Lagos', lgas: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'] },
    { name: 'Nasarawa', lgas: ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'] },
    { name: 'Niger', lgas: ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'] },
    { name: 'Ogun', lgas: ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'] },
    { name: 'Ondo', lgas: ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'] },
    { name: 'Osun', lgas: ['Aiyedaade', 'Aiyedire', 'Atakunmosa East', 'Atakunmosa West', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'] },
    { name: 'Oyo', lgas: ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'] },
    { name: 'Plateau', lgas: ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase'] },
    { name: 'Rivers', lgas: ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'] },
    { name: 'Sokoto', lgas: ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'] },
    { name: 'Taraba', lgas: ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'] },
    { name: 'Yobe', lgas: ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'] },
    { name: 'Zamfara', lgas: ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi'] }
  ]
};

// ============================================
// MAIN COMPONENT
// ============================================
const Step1Details = ({ formData, setFormData, onNext, isLoading }) => {
  const [errors, setErrors] = useState({});
  const [age, setAge] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const parts = formData.dateOfBirth.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const dob = new Date(year, month, day);
          if (!isNaN(dob)) {
            const age = calculateAge(dob);
            setAge(age);
            setFormData(prev => ({ ...prev, age }));
          }
        }
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

  // Handle Date of Birth change with react-datepicker
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date && isValid(date)) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      setFormData(prev => ({ 
        ...prev, 
        dateOfBirth: formattedDate 
      }));
      const age = calculateAge(date);
      setAge(age);
      setFormData(prev => ({ ...prev, age }));
      // Clear error
      if (errors.dateOfBirth) {
        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        dateOfBirth: '' 
      }));
      setAge(null);
    }
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

    // Profile photo validation
    if (!formData.profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }

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

    // Date format validation
    if (formData.dateOfBirth) {
      const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!datePattern.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Date must be in DD/MM/YYYY format';
      }
    }

    // Languages validation - at least one language with at least one skill
    const hasLanguageSkill = Object.values(formData.languages || {}).some(
      lang => lang.read || lang.write || lang.speak || lang.understand
    );
    if (!hasLanguageSkill) {
      newErrors.languages = 'At least one language skill is required';
    }

    // Education validation - at least one selected
    if (!formData.education || formData.education.length === 0) {
      newErrors.education = 'Please select at least one education level';
    }

    // Documents validation - at least one selected
    if (!formData.idProofType || formData.idProofType.length === 0) {
      newErrors.idProofType = 'Please select at least one ID proof';
    }

    // Upload Documents validation
    if (!formData.documents || formData.documents.length === 0) {
      newErrors.documents = 'Please upload at least one document';
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
  const languages = ['english', 'yoruba', 'Igbo-Hausa'];
  const skills = ['read', 'write', 'speak', 'understand'];

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {/* ============================================
            VOLUNTEER ID & INITIALS
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
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
                  if (errors.profilePhoto) {
                    setErrors(prev => ({ ...prev, profilePhoto: '' }));
                  }
                } else if (file) {
                  alert('File size exceeds 5MB limit');
                }
              }}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP · Max 5MB</p>
            {errors.profilePhoto && <p className="text-red-500 text-sm mt-1">{errors.profilePhoto}</p>}
          </div>
        </div>

        {/* ============================================
            PERSONAL INFORMATION
            ============================================ */}
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
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="DD/MM/YYYY"
                maxDate={new Date()}
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                className={`input-field w-full ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                wrapperClassName="w-full"
                popperClassName="z-50"
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              <p className="text-xs text-gray-400 mt-1">Format: DD/MM/YYYY</p>
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

        {/* ============================================
            LOCATION DETAILS - NIGERIA
            ============================================ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Location Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State of Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State of Origin <span className="text-red-500">*</span>
              </label>
              <select
                name="stateOfOrigin"
                value={formData.stateOfOrigin || ''}
                onChange={(e) => {
                  const state = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    stateOfOrigin: state,
                    localGovernment: '' 
                  }));
                  if (errors.localGovernment) {
                    setErrors(prev => ({ ...prev, localGovernment: '' }));
                  }
                }}
                className={`input-field ${errors.stateOfOrigin ? 'border-red-500' : ''}`}
              >
                <option value="">— Select State —</option>
                {NIGERIA_DATA.states.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.stateOfOrigin && (
                <p className="text-red-500 text-sm mt-1">{errors.stateOfOrigin}</p>
              )}
            </div>

            {/* Local Government Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Government Area <span className="text-red-500">*</span>
              </label>
              <select
                name="localGovernment"
                value={formData.localGovernment || ''}
                onChange={handleChange}
                className={`input-field ${errors.localGovernment ? 'border-red-500' : ''} ${
                  !formData.stateOfOrigin ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!formData.stateOfOrigin}
              >
                <option value="">
                  {formData.stateOfOrigin ? '— Select LGA —' : 'Select state first'}
                </option>
                {formData.stateOfOrigin && (
                  NIGERIA_DATA.states
                    .find(s => s.name === formData.stateOfOrigin)
                    ?.lgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))
                )}
              </select>
                            {errors.localGovernment && (
                <p className="text-red-500 text-sm mt-1">{errors.localGovernment}</p>
              )}
              {formData.stateOfOrigin && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {NIGERIA_DATA.states.find(s => s.name === formData.stateOfOrigin)?.lgas.length} LGAs available
                </p>
              )}
            </div>
          </div>

          {/* City/Town */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City / Town <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              className={`input-field ${errors.city ? 'border-red-500' : ''}`}
              placeholder="e.g., Ikeja, Surulere, Garki, etc."
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>

          {/* Residential Address */}
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
              placeholder="Enter full residential address (e.g., House number, street, area, landmark)"
            />
            {errors.residentialAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.residentialAddress}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Example: 12, Lagos Street, Alimosho, Lagos</p>
          </div>
        </div>

        {/* ============================================
            CONTACT INFORMATION
            ============================================ */}
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
    onChange={(e) => {
      const value = e.target.value;
      // Allow only digits
      const digitsOnly = value.replace(/\D/g, '');
      
      // ✅ Check if more than 11 digits
      if (digitsOnly.length > 11) {
        alert('Please enter a valid phone number (maximum 11 digits)');
        return;
      }
      
      setFormData(prev => ({ ...prev, phone: digitsOnly }));
      
      // Clear error
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }}
    onKeyDown={(e) => {
      // Prevent typing more than 11 digits
      const currentValue = formData.phone || '';
      if (currentValue.length >= 11 && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        alert('Phone number cannot exceed 11 digits');
        e.preventDefault();
      }
    }}
    maxLength={11}
    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
    placeholder="e.g. 08012345678"
  />
  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
  <p className="text-xs text-gray-400 mt-1">Must start with 0 and be 11 digits</p>
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

        {/* ============================================
            EMERGENCY CONTACT
            ============================================ */}
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
              <p className="text-xs text-gray-400 mt-1">Must start with 0 and be 11 digits</p>
            </div>
          </div>
        </div>

        {/* ============================================
            LANGUAGES
            ============================================ */}
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
                          className="h-4 w-4 text-biomed-green focus:ring-biomed-green"
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
                        className="h-4 w-4 text-biomed-green focus:ring-biomed-green"
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

        {/* ============================================
            DIETARY HABITS
            ============================================ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dietary Habits <span className="text-red-500">*</span>
          </h3>
          <div className="flex flex-wrap gap-6">
            {['Vegetarian', 'Non-Vegetarian', 'Both'].map(option => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dietaryHabit"
                  value={option}
                  checked={formData.dietaryHabit === option}
                  onChange={handleChange}
                  className="h-4 w-4 text-biomed-green"
                />
                {option}
              </label>
            ))}
          </div>
          {errors.dietaryHabit && <p className="text-red-500 text-sm mt-1">{errors.dietaryHabit}</p>}
        </div>

        {/* ============================================
            DOCUMENTS SUBMITTED (Checkboxes)
            ============================================ */}
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
              <label key={option} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
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
                  className="h-4 w-4 text-biomed-green focus:ring-biomed-green"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
          {errors.idProofType && <p className="text-red-500 text-sm mt-1">{errors.idProofType}</p>}
        </div>

        {/* ============================================
            UPLOAD DOCUMENTS
            ============================================ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Documents <span className="text-red-500">*</span>
          </h3>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
            errors.documents ? 'border-red-500' : 'border-gray-300'
          }`}>
            <input
              type="file"
              multiple
              webkitdirectory
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
                setFormData(prev => ({
                  ...prev,
                  documents: validFiles
                }));
                if (errors.documents) {
                  setErrors(prev => ({ ...prev, documents: '' }));
                }
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
              <p className="text-sm text-green-600">✓ {formData.documents.length} file(s) selected</p>
              <ul className="text-xs text-gray-500 mt-1">
                {formData.documents.map((file, index) => (
                  <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          )}
          {errors.documents && <p className="text-red-500 text-sm mt-1">{errors.documents}</p>}
        </div>

        {/* ============================================
            EDUCATION & OCCUPATION (2-Column Layout)
            ============================================ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education & Occupation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
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
                  <label key={option} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                    formData.education?.includes(option) 
                      ? 'border-biomed-green bg-green-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
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

        {/* ============================================
            REMARKS
            ============================================ */}
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

      {/* ============================================
          ACTION BUTTONS
          ============================================ */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="px-6 py-2 bg-biomed-green text-white rounded-md hover:bg-biomed-green-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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