import { StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatIndonesianDate } from "@/lib/letters/letter-format";
import type { LetterSigner } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  wrap: {
    width: 250,
    marginLeft: "auto",
    marginTop: 34,
  },
  line: {
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.2,
  },
  actingFor: {
    marginTop: 12,
  },
  title: {
    marginTop: 4,
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
    <View style={styles.wrap} wrap={false}>
      <Text style={styles.line}>
        {signer.place}
        {date ? `, ${date}` : ""}
      </Text>
      {signer.actingFor ? (
        <Text style={[styles.line, styles.actingFor]}>{signer.actingFor}</Text>
      ) : null}
      <Text style={[styles.line, styles.title]}>{signer.title},</Text>
      <Text style={styles.signerName}>{signer.name}</Text>
      <Text style={styles.nip}>NIP.{signer.nip}</Text>
    </View>
  );
}
