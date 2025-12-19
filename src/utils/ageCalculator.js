import dayjs from 'dayjs';

export const calculateAge = (birthDate) => {
  return dayjs().diff(dayjs(birthDate), 'year');
};

export const isAdult = (birthDate) => {
  return calculateAge(birthDate) >= 18;
};
