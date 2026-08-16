import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractTextFromPDF = async (fileBuffer) => {
    const data = new Uint8Array(fileBuffer);

    const pdf = await getDocument({ data }).promise;

    let text = "";

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);

        const content = await page.getTextContent();

        text +=
            content.items
                .map(item => item.str)
                .join(" ") + "\n";
    }

    return text.trim();
};