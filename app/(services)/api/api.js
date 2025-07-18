import axios from "axios";

const loginUser = async ({ phone, password }) => {
  const response = await axios.post(
    "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/auth/login",
    {
      phone,
      password,
    }
  );
  return response.data;
};

const registerUser = async ({ name, email, phone, password }) => {
  const response = await axios.post(
    "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/auth/register",
    {
      name,
      email,
      phone,
      password,
    }
  );
  return response.data;
};

const loginDriver = async ({ email, password }) => {
  const response = await axios.post(
    "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/auth/driver/login",
    {
      email,
      password,
    }
  );
  return response.data;
};

const registerDriver = async ({
  name,
  email,
  phone,
  password,
  gender,
  vehicleInfo,
}) => {
  const response = await axios.post(
    "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/auth/driver/register",
    {
      name,
      email,
      phone,
      password,
      gender,
      vehicleInfo,
    }
  );
  return response.data;
};

export { loginUser, registerUser, loginDriver, registerDriver };
