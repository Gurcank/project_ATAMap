import { describe, expect, it } from 'vitest';
import { diplomaticToText } from '../../scripts/lib/diplomatic.ts';

describe('diplomaticToText (SPEC A20/A21)', () => {
  it('joins line-end hyphenation, with or without a space before the hyphen', () => {
    expect(diplomaticToText('¶Bu siyaset takip olun-\nmaktadır. Adliye -\nmizin')).toBe(
      'Bu siyaset takip olunmaktadır. Adliyemizin',
    );
  });

  it('keeps a hyphen that is not at a line end', () => {
    expect(diplomaticToText('¶Mersin - Adana demiryolu')).toBe('Mersin - Adana demiryolu');
  });

  it('turns other line breaks into one space and keeps paragraphs apart', () => {
    expect(diplomaticToText('¶Birinci\nsatır.\n¶İkinci')).toBe('Birinci satır.\n\nİkinci');
  });

  it('removes stenographer notes, also across lines, and the space before following punctuation', () => {
    expect(
      diplomaticToText(
        '¶müstenittir {( Alkışlar )}.\n¶selâmlarım. {( Alkışlar, teşekkür\nederiz sesleri )}',
      ),
    ).toBe('müstenittir.\n\nselâmlarım.');
  });

  it('drops a note together with the period that belongs to it', () => {
    expect(diplomaticToText('¶geldi. {(Bravo sesleri).}\n¶Sonra geldi {(Alkışlar)}.')).toBe(
      'geldi.\n\nSonra geldi.',
    );
  });

  it('removes typesetting spaces around punctuation only', () => {
    expect(diplomaticToText('¶türk harfleri , memleketin ; ( 445 ) km .')).toBe(
      'türk harfleri, memleketin; (445) km.',
    );
  });

  it('removes the space before ! and ?', () => {
    expect(diplomaticToText('¶Efendiler ! geçene sene mi ?')).toBe('Efendiler! geçene sene mi?');
  });

  it('accepts a column-split number in page markers', () => {
    expect(diplomaticToText('## s.3 sol 0.56\n¶Metin')).toBe('Metin');
  });

  it('never touches spelling or case', () => {
    const line = "¶Cümhuriyetin dahilî siyaseti, kat'î, sür'atle, zenğinleştirecek, deverede";
    expect(diplomaticToText(line)).toBe(line.slice(1));
  });

  it('ignores comments and page markers', () => {
    expect(diplomaticToText('# not\n## s.2 sağ\n¶Metin')).toBe('Metin');
  });
});
