// Test SUMIFS calculation with actual user data
const testData = [
  ["ABIGAIL & CHAMA ADVOCATES", 45720, "Active", 1243],
  ["ACCESS BANK ZAMBIA", 45849, "Active", 1232],
  ["ACDI/ VOCA", 44245, "Domant", 1221],
  ["ADLAB", 42139, "Domant", 1210],
  ["AFFORDA COMPANY LIMITED", 47027, "Active", 1199],
  ["AFIRCARE ZAMBIA", 42604, "Domant", 1188],
  ["AFRICAN GREY INSURANCE", 44908, "Domant", 1155],
  ["AFRIDELIVERY ZAMBIA LTD", 45474, "Active", 1100],
  ["AIRTEL ZAMBIA", 45903, "Active", 1078],
  ["AKME GENERAL DEALERS", 45303, "Active", 1067],
  ["AM HLAZO & CO", 45748, "Active", 1034],
  ["BAKER TILLY INTERNATIONAL", 45383, "Active", 968],
  ["BANANI INTERNATIONAL SCHOOL", 46905, "Active", 957],
  ["BARLOWORLD EQUIPMENT ZAMBIA", 45699, "Active", 946],
  ["BAYPORT FINANCIAL SERVICES", 45273, "Active", 924],
  ["BENEFITS CONSULTING SERVICES LIMITED", 45839, "Active", 902],
  ["BONGO HIVE", 45236, "Active", 847],
  ["BONGOHIVE CONSULT LIMITED", 45931, "Active", 836],
  ["BOOKWORLD LIMITED", 45545, "Active", 825],
  ["CGRATE/543 KONSE KONSE", 48580, "Active", 726],
  ["CHEMSOL SCIENTIFIC LIMITED", 45694, "Active", 660],
  ["COMESA SECRETARIAT", 45883, "Active", 429],
  ["DAI GLOBAL- NLA(NATIONAL LAND AUDIT)", 45702, "Active", 374],
  ["DTWOC TELCARE LTD", 45694, "Active", 308],
  ["ECOBANK", 45292, "Active", 275],
  ["FINSBURY REINSURANCE LIMITED", 45695, "Active", 154],
  ["G4S SECURE SOLUTIONS ZAMBIA", 46006, "Active", 132],
];

const columns = ["Customer Name", "Long Last", "Contract Expiry Date", "Comment", "Amount"];

// Convert array data to objects
const dataObjects = testData.map(row => ({
  "Customer Name": row[0],
  "Long Last": row[1],
  "Contract Expiry Date": row[2],
  "Comment": row[3],
  "Amount": row[4]
}));

console.log("Sample data structure:", dataObjects[0]);
console.log("\nTotal rows:", dataObjects.length);

// Test SUMIFS: Sum Amount where Comment = "Active"
const criteria = [{ column: "Comment", value: "Active" }];

const filteredData = dataObjects.filter(row => {
  return criteria.every(crit => {
    if (!crit.column || crit.value === undefined || crit.value === '') {
      return true;
    }
    
    const cellValue = row[crit.column];
    const criteriaValue = crit.value;
    
    // Handle comparison operators
    if (typeof criteriaValue === 'string') {
      if (criteriaValue.startsWith('>=')) {
        return parseFloat(cellValue) >= parseFloat(criteriaValue.substring(2));
      } else if (criteriaValue.startsWith('<=')) {
        return parseFloat(cellValue) <= parseFloat(criteriaValue.substring(2));
      } else if (criteriaValue.startsWith('>')) {
        return parseFloat(cellValue) > parseFloat(criteriaValue.substring(1));
      } else if (criteriaValue.startsWith('<')) {
        return parseFloat(cellValue) < parseFloat(criteriaValue.substring(1));
      } else if (criteriaValue.startsWith('=')) {
        return String(cellValue) === criteriaValue.substring(1);
      } else if (criteriaValue.startsWith('!=') || criteriaValue.startsWith('<>')) {
        return String(cellValue) !== criteriaValue.substring(2);
      }
    }
    
    // Text matching (case-insensitive contains)
    return String(cellValue || '').toLowerCase().includes(String(criteriaValue).toLowerCase());
  });
});

console.log("\nFiltered rows (Comment contains 'Active'):", filteredData.length);
console.log("Filtered data sample:", filteredData.slice(0, 3));

const values = filteredData.map(row => Number(row["Amount"]) || 0);
const sum = values.reduce((acc, val) => acc + val, 0);

console.log("\nValues to sum:", values);
console.log("\n*** SUMIFS RESULT ***");
console.log("Sum of Amount where Comment = 'Active':", sum);
console.log("Expected: All rows with 'Active' in Comment column");
console.log("Actual Active rows found:", filteredData.length);
