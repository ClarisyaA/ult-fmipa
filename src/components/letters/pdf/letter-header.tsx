import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
/* eslint-disable jsx-a11y/alt-text */

import {
  getExistingLetterAssetSource,
  letterLogoPath,
} from "@/components/letters/pdf/letter-assets";
import type { LetterLanguage } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  header: {
    position: "relative",
    height: 113,
  },
  logo: {
    position: "absolute",
    left: 6,
    top: 0,
    width: 79,
    height: 79,
    objectFit: "contain",
  },
  textWrap: {
    position: "absolute",
    left: 76,
    right: 0,
    top: -8,
    textAlign: "center",
  },
  ministry: {
    fontFamily: "Times-Roman",
    fontSize: 16,
    lineHeight: 1.15,
  },
  university: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    lineHeight: 1.2,
  },
  faculty: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    lineHeight: 1.25,
  },
  address: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.18,
  },
  thickLine: {
    position: "absolute",
    left: 0,
    right: -6,
    top: 107,
    height: 2.8,
    backgroundColor: "#111111",
  },
  thinLine: {
    position: "absolute",
    left: 0,
    right: -6,
    top: 111,
    height: 0.8,
    backgroundColor: "#111111",
  },
});

export function LetterHeader({ language = "id" }: { language?: LetterLanguage }) {
  const logoSource = getExistingLetterAssetSource(letterLogoPath);
  const isEnglish = language === "en";

  return (
    <View style={styles.header}>
      {logoSource ? <Image src={logoSource} style={styles.logo} /> : null}
      <View style={styles.textWrap}>
        <Text style={styles.ministry}>
          {isEnglish
            ? "MINISTRY OF HIGHER EDUCATION, SCIENCE,"
            : "KEMENTERIAN PENDIDIKAN TINGGI, SAINS,"}
        </Text>
        <Text style={styles.ministry}>
          {isEnglish ? "AND TECHNOLOGY" : "DAN TEKNOLOGI"}
        </Text>
        <Text style={styles.university}>UNIVERSITAS PADJADJARAN</Text>
        <Text style={styles.faculty}>
          {isEnglish
            ? "FACULTY OF MATHEMATICS AND NATURAL SCIENCES"
            : "FAKULTAS MATEMATIKA DAN ILMU PENGETAHUAN ALAM"}
        </Text>
        <Text style={styles.address}>
          Jalan Ir. Soekarno Km. 21 Jatinangor, Sumedang 45363
        </Text>
        <Text style={styles.address}>
          {isEnglish ? "Phone" : "Telepon"} 081120240789 - 082115975752
        </Text>
        <Text style={styles.address}>
          Website: http://www.fmipa.unpad.ac.id e-mail: fmipa@unpad.ac.id
        </Text>
      </View>
      <View style={styles.thickLine} />
      <View style={styles.thinLine} />
    </View>
  );
}
