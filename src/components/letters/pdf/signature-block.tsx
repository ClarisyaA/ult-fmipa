import { StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatLetterDate } from "@/lib/letters/letter-format";
import type { LetterLanguage, LetterSigner } from "@/lib/letters/letter-types";

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

function translateSignerText(value: string | null | undefined, language: LetterLanguage) {
  const text = value?.trim() ?? "";

  if (language !== "en") {
    return text;
  }

  const normalized = text.toLowerCase();

  if (normalized === "dekan") {
    return "Dean";
  }

  if (normalized === "a.n. dekan" || normalized === "an. dekan") {
    return "on behalf of the Dean";
  }

  if (normalized.includes("wakil dekan") && normalized.includes("akademik")) {
    return "Vice Dean for Academic, Student Affairs, and Research";
  }

  return text;
}

export function SignatureBlock({
  signer,
  language = "id",
}: {
  signer: LetterSigner;
  language?: LetterLanguage;
}) {
  const date = formatLetterDate(signer.letterDate, language);

  return (
    <View style={styles.wrap} wrap={false}>
      <Text style={styles.line}>
        {signer.place}
        {date ? `, ${date}` : ""}
      </Text>
      {signer.actingFor ? (
        <Text style={[styles.line, styles.actingFor]}>
          {translateSignerText(signer.actingFor, language)}
        </Text>
      ) : null}
      <Text style={[styles.line, styles.title]}>
        {translateSignerText(signer.title, language)},
      </Text>
      <Text style={styles.signerName}>{signer.name}</Text>
      <Text style={styles.nip}>NIP.{signer.nip}</Text>
    </View>
  );
}
