import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
/* eslint-disable jsx-a11y/alt-text */

import {
  getExistingLetterAsset,
  letterLogoPath,
} from "@/components/letters/pdf/letter-assets";

const styles = StyleSheet.create({
  header: {
    position: "relative",
    paddingTop: 2,
    paddingBottom: 10,
  },
  logo: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 79,
    height: 79,
    objectFit: "contain",
  },
  textWrap: {
    marginLeft: 76,
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
    marginTop: 8,
    height: 2.8,
    backgroundColor: "#111111",
  },
  thinLine: {
    marginTop: 1.5,
    height: 0.8,
    backgroundColor: "#111111",
  },
});

export function LetterHeader() {
  const logoPath = getExistingLetterAsset(letterLogoPath);

  return (
    <View style={styles.header}>
      {logoPath ? <Image src={logoPath} style={styles.logo} /> : null}
      <View style={styles.textWrap}>
        <Text style={styles.ministry}>KEMENTERIAN PENDIDIKAN TINGGI, SAINS,</Text>
        <Text style={styles.ministry}>DAN TEKNOLOGI</Text>
        <Text style={styles.university}>UNIVERSITAS PADJADJARAN</Text>
        <Text style={styles.faculty}>
          FAKULTAS MATEMATIKA DAN ILMU PENGETAHUAN ALAM
        </Text>
        <Text style={styles.address}>
          Jalan Ir. Soekarno Km. 21 Jatinangor, Sumedang 45363
        </Text>
        <Text style={styles.address}>Telepon 081120240789 - 082115975752</Text>
        <Text style={styles.address}>
          Website: http://www.fmipa.unpad.ac.id e-mail: fmipa@unpad.ac.id
        </Text>
      </View>
      <View style={styles.thickLine} />
      <View style={styles.thinLine} />
    </View>
  );
}
