#!/usr/bin/env python3
"""index.html 에서 사람이 읽는 텍스트만 뽑는다.

마크업·클래스·속성은 전부 버리고 텍스트 노드만 남긴다.
리디자인이 레이아웃을 바꿔도 문구가 그대로면 결과가 같아야 한다.
섹션 내부 재배치는 허용된 범위라서 출력은 정렬해 multiset 으로 비교한다.
"""
import re
import sys
from html.parser import HTMLParser

SKIP_TAGS = {"script", "style"}


class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.chunks = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if self.depth:
            return
        text = re.sub(r"\s+", " ", data).strip()
        if text:
            self.chunks.append(text)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
    parser = TextOnly()
    with open(path, encoding="utf-8") as fh:
        parser.feed(fh.read())
    for line in sorted(parser.chunks):
        print(line)


if __name__ == "__main__":
    main()
