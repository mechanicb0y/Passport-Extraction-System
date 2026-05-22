export const countryProfiles = [
  {
    code: "USA",
    country: "United States",
    nationality: "UNITED STATES OF AMERICA",
    authority: "U.S. Department of State",
    placeOptions: ["NEW YORK", "CALIFORNIA", "TEXAS", "ILLINOIS"],
    passportPattern: "9 digits",
    passportRegex: /^\d{9}$/
  },
  {
    code: "GBR",
    country: "United Kingdom",
    nationality: "BRITISH CITIZEN",
    authority: "HM Passport Office",
    placeOptions: ["LONDON", "MANCHESTER", "EDINBURGH", "CARDIFF"],
    passportPattern: "9 digits",
    passportRegex: /^\d{9}$/
  },
  {
    code: "SGP",
    country: "Singapore",
    nationality: "SINGAPORE CITIZEN",
    authority: "Immigration and Checkpoints Authority",
    placeOptions: ["SINGAPORE"],
    passportPattern: "1 letter and 7 digits",
    passportRegex: /^[A-Z]\d{7}$/
  },
  {
    code: "PHL",
    country: "Philippines",
    nationality: "FILIPINO",
    authority: "Department of Foreign Affairs",
    placeOptions: ["MANILA", "CEBU", "DAVAO", "QUEZON CITY"],
    passportPattern: "1 letter and 7 digits",
    passportRegex: /^[A-Z]\d{7}$/
  },
  {
    code: "IND",
    country: "India",
    nationality: "INDIAN",
    authority: "Ministry of External Affairs",
    placeOptions: ["DELHI", "MUMBAI", "BENGALURU", "CHENNAI"],
    passportPattern: "1 letter and 7 digits",
    passportRegex: /^[A-Z]\d{7}$/
  },
  {
    code: "CAN",
    country: "Canada",
    nationality: "CANADIAN",
    authority: "Passport Program",
    placeOptions: ["TORONTO", "VANCOUVER", "MONTREAL", "OTTAWA"],
    passportPattern: "2 letters and 6 digits",
    passportRegex: /^[A-Z]{2}\d{6}$/
  },
  {
    code: "AUS",
    country: "Australia",
    nationality: "AUSTRALIAN",
    authority: "Australian Passport Office",
    placeOptions: ["SYDNEY", "MELBOURNE", "BRISBANE", "PERTH"],
    passportPattern: "1 letter and 8 digits",
    passportRegex: /^[A-Z]\d{8}$/
  },
  {
    code: "DEU",
    country: "Germany",
    nationality: "GERMAN",
    authority: "Bundesdruckerei",
    placeOptions: ["BERLIN", "MUNICH", "HAMBURG", "COLOGNE"],
    passportPattern: "9 alphanumeric characters",
    passportRegex: /^[A-Z0-9]{9}$/
  },
  {
    code: "FRA",
    country: "France",
    nationality: "FRENCH",
    authority: "Ministere de l'Interieur",
    placeOptions: ["PARIS", "LYON", "MARSEILLE", "NANTES"],
    passportPattern: "2 digits, 2 letters, 5 digits",
    passportRegex: /^\d{2}[A-Z]{2}\d{5}$/
  },
  {
    code: "JPN",
    country: "Japan",
    nationality: "JAPANESE",
    authority: "Ministry of Foreign Affairs",
    placeOptions: ["TOKYO", "OSAKA", "KYOTO", "YOKOHAMA"],
    passportPattern: "2 letters and 7 digits",
    passportRegex: /^[A-Z]{2}\d{7}$/
  }
];

export const samplePeople = [
  { givenNames: "AMELIA ROSE", surname: "CARTER", sex: "F" },
  { givenNames: "NOAH JAMES", surname: "BENNETT", sex: "M" },
  { givenNames: "MAYA LEI", surname: "SANTOS", sex: "F" },
  { givenNames: "ADAM KAI", surname: "LIM", sex: "M" },
  { givenNames: "PRIYA ANIKA", surname: "RAO", sex: "F" },
  { givenNames: "HUGO LOUIS", surname: "MARTIN", sex: "M" },
  { givenNames: "EMMA CLAIRE", surname: "WILSON", sex: "F" },
  { givenNames: "LEON MAX", surname: "SCHMIDT", sex: "M" },
  { givenNames: "SORA REN", surname: "TANAKA", sex: "X" },
  { givenNames: "OLIVER JAY", surname: "MORGAN", sex: "M" }
];

export function getCountryProfile(code) {
  return countryProfiles.find((profile) => profile.code === code) ?? countryProfiles[0];
}
