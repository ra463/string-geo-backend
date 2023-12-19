exports.generateCode = () => {
  let code = "";
  const numbers = "0123456789";
  const numberLength = numbers.length;

  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numberLength));
  }

  return code;
};
