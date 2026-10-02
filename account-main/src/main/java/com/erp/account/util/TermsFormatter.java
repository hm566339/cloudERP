package com.erp.account.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class TermsFormatter {

    // Regex to detect numbered lists: starts with a digit, followed by . or ), and a space
    // e.g., "1. ", "2) ", "10."
    private static final Pattern NUMBERED_ITEM_PATTERN = Pattern.compile("(?=(^|\\s)\\d+[\\.\\)]\\s)");

    public static List<String> formatTermsAndConditions(String content) {
        if (content == null || content.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // If it already has multiple lines (actual newlines) or literal "\n", first split by them.
        // We handle FORMAT 3 (newline separated plain text) and FORMAT 1 (newline separated numbered text)
        if (content.contains("\n") || content.contains("\\n")) {
            return Arrays.stream(content.split("\\r?\\n|\\\\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        // Format 2: It is one single continuous line, possibly with numbers inside.
        // Let's try to split using the regex.
        List<String> items = new ArrayList<>();
        Matcher m = NUMBERED_ITEM_PATTERN.matcher(content);
        int lastEnd = 0;

        while (m.find()) {
            if (m.start() > lastEnd) {
                String chunk = content.substring(lastEnd, m.start()).trim();
                if (!chunk.isEmpty()) {
                    items.add(chunk);
                }
            }
            lastEnd = m.start();
        }

        // Add the last chunk
        if (lastEnd < content.length()) {
            String chunk = content.substring(lastEnd).trim();
            if (!chunk.isEmpty()) {
                items.add(chunk);
            }
        }

        // If the regex didn't find any numbers, just return the whole string as one item
        if (items.isEmpty()) {
            items.add(content.trim());
        }

        return items;
    }
}
