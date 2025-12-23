import type { MysteryPlayer, Mask } from "../models/PlayerData";
import {
  BIRTH_YEAR_NEAR_THRESHOLD,
  MAJORS_NEAR_THRESHOLD,
} from "../constants.js";

const COUNTRY_REGIONS: Record<string, "Europe" | "CIS" | "Americas" | "APAC"> =
  {
    Denmark: "Europe",
    France: "Europe",
    Germany: "Europe",
    Sweden: "Europe",
    Norway: "Europe",
    Finland: "Europe",
    Poland: "Europe",
    Netherlands: "Europe",
    Belgium: "Europe",
    Spain: "Europe",
    Portugal: "Europe",
    Italy: "Europe",
    Switzerland: "Europe",
    Austria: "Europe",
    "Czech Republic": "Europe",
    Slovakia: "Europe",
    Hungary: "Europe",
    Romania: "Europe",
    Bulgaria: "Europe",
    Croatia: "Europe",
    Serbia: "Europe",
    Montenegro: "Europe",
    "Bosnia and Herzegovina": "Europe",
    Slovenia: "Europe",
    Estonia: "Europe",
    Latvia: "Europe",
    Lithuania: "Europe",
    Turkey: "Europe",
    UK: "Europe",
    "United Kingdom": "Europe",
    Ireland: "Europe",
    Iceland: "Europe",
    Greece: "Europe",
    Cyprus: "Europe",
    Malta: "Europe",
    Luxembourg: "Europe",
    Liechtenstein: "Europe",
    Monaco: "Europe",
    Andorra: "Europe",
    "San Marino": "Europe",
    "Vatican City": "Europe",
    Russia: "CIS",
    Ukraine: "CIS",
    Belarus: "CIS",
    Kazakhstan: "CIS",
    Uzbekistan: "CIS",
    Turkmenistan: "CIS",
    Kyrgyzstan: "CIS",
    Tajikistan: "CIS",
    Armenia: "CIS",
    Azerbaijan: "CIS",
    Georgia: "CIS",
    Moldova: "CIS",
    USA: "Americas",
    "United States": "Americas",
    Canada: "Americas",
    Brazil: "Americas",
    Argentina: "Americas",
    Chile: "Americas",
    Peru: "Americas",
    Colombia: "Americas",
    Mexico: "Americas",
    Uruguay: "Americas",
    Paraguay: "Americas",
    Bolivia: "Americas",
    Ecuador: "Americas",
    Venezuela: "Americas",
    Guyana: "Americas",
    Suriname: "Americas",
    "French Guiana": "Americas",
    Guatemala: "Americas",
    Belize: "Americas",
    "El Salvador": "Americas",
    Honduras: "Americas",
    Nicaragua: "Americas",
    "Costa Rica": "Americas",
    Panama: "Americas",
    Cuba: "Americas",
    Jamaica: "Americas",
    Haiti: "Americas",
    "Dominican Republic": "Americas",
    China: "APAC",
    Japan: "APAC",
    "South Korea": "APAC",
    Thailand: "APAC",
    Vietnam: "APAC",
    Singapore: "APAC",
    India: "APAC",
    Israel: "APAC",
    UAE: "APAC",
    "Saudi Arabia": "APAC",
    Egypt: "APAC",
    Iran: "APAC",
    Iraq: "APAC",
    Jordan: "APAC",
    Lebanon: "APAC",
    Syria: "APAC",
    Yemen: "APAC",
    Oman: "APAC",
    Qatar: "APAC",
    Bahrain: "APAC",
    Kuwait: "APAC",
    Pakistan: "APAC",
    Bangladesh: "APAC",
    "Sri Lanka": "APAC",
    Myanmar: "APAC",
    Cambodia: "APAC",
    Laos: "APAC",
    Malaysia: "APAC",
    Indonesia: "APAC",
    Philippines: "APAC",
    Brunei: "APAC",
    Maldives: "APAC",
    Nepal: "APAC",
    Bhutan: "APAC",
    Mongolia: "APAC",
    "North Korea": "APAC",
    Taiwan: "APAC",
    "Hong Kong": "APAC",
    Macau: "APAC",
    Australia: "APAC",
    "New Zealand": "APAC",
    Fiji: "APAC",
    "Papua New Guinea": "APAC",
    "Solomon Islands": "APAC",
    Vanuatu: "APAC",
    Samoa: "APAC",
    Tonga: "APAC",
    Kiribati: "APAC",
    Tuvalu: "APAC",
    Nauru: "APAC",
    Palau: "APAC",
    "Marshall Islands": "APAC",
    Micronesia: "APAC",
    CIS: "CIS",
    Unknown: "APAC",
  };

function getCountryRegion(
  country: string
): "Europe" | "CIS" | "Americas" | "APAC" {
  return COUNTRY_REGIONS[country] || "APAC";
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function compareGuess(
  guessedPlayer: MysteryPlayer,
  answerPlayer: MysteryPlayer
): Mask {
  const currentYear = new Date().getFullYear();
  const guessedAge = currentYear - guessedPlayer.birthYear;
  const answerAge = currentYear - answerPlayer.birthYear;
  const ageDiff = guessedAge - answerAge;
  const majorsDiff = guessedPlayer.majorsPlayed - answerPlayer.majorsPlayed;

  return {
    playerName:
      guessedPlayer.playerName === answerPlayer.playerName ? "M" : "D",
    team: guessedPlayer.team === answerPlayer.team ? "M" : "D",
    country:
      guessedPlayer.country === answerPlayer.country
        ? "M"
        : getCountryRegion(guessedPlayer.country) ===
            getCountryRegion(answerPlayer.country)
          ? "N"
          : "D",
    birthYear:
      guessedPlayer.birthYear === answerPlayer.birthYear
        ? "M"
        : Math.abs(ageDiff) <= BIRTH_YEAR_NEAR_THRESHOLD
          ? "N"
          : "D",
    majorsPlayed:
      guessedPlayer.majorsPlayed === answerPlayer.majorsPlayed
        ? "M"
        : Math.abs(majorsDiff) <= MAJORS_NEAR_THRESHOLD
          ? "N"
          : "D",
    role: guessedPlayer.role === answerPlayer.role ? "M" : "D",
  };
}
