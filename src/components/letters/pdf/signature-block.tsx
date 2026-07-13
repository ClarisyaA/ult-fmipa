import { StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatIndonesianDate } from "@/lib/letters/letter-format";
import type { LetterSigner } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  wrap: {
    width: 230,
    marginLeft: "auto",
    marginTop: 24,
  },
  line: {
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.35,
  },
  signerName: {
    fontFamily: "Helvetica",
    fontSize: 11,
    marginTop: 52,
  },
  nip: {
    fontFamily: "Helvetica",
    fontSize: 11,
    marginTop: 4,
  },
});

export function SignatureBlock({ signer }: { signer: LetterSigner }) {
  const date = formatIndonesianDate(signer.letterDate);

  return (
    <View style={styles.wrap}>
      <Text style={styles.line}>
        {signer.place}
        {date ? `, ${date}` : ""}
      </Text>
      {signer.actingFor ? (
        <Text style={[styles.line, { marginTop: 8 }]}>{signer.actingFor}</Text>
      ) : null}
      <Text style={styles.line}>{signer.title},</Text>
      <Text style={styles.signerName}>{signer.name}</Text>
      <Text style={styles.nip}>NIP.{signer.nip}</Text>
    </View>
  );
}
