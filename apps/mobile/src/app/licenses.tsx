import { DetailPage, DetailRow, Section } from "../components/DetailUI";
import notices from "../legal/notices.json";

export default function Licenses() {
  return (
    <DetailPage title="ライセンス">
      {notices.map(({ title, text }) => (
        <Section key={title} title={title}>
          <DetailRow title={text.trimEnd()} />
        </Section>
      ))}
    </DetailPage>
  );
}
