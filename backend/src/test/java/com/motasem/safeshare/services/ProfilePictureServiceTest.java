package com.motasem.safeshare.services;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProfilePictureServiceTest {

    private final ProfilePictureService service = new ProfilePictureService();

    @Test
    void anImageBecomesADataUrl() throws Exception {
        MockMultipartFile png = new MockMultipartFile("file", "me.png", "image/png", new byte[]{1, 2, 3});

        assertEquals("data:image/png;base64,AQID", service.toDataUrl(png));
    }

    @Test
    void svgAndOtherTypesAreRefused() {
        MockMultipartFile svg = new MockMultipartFile("file", "x.svg", "image/svg+xml", "<svg/>".getBytes());
        MockMultipartFile html = new MockMultipartFile("file", "x.html", "text/html", "<script/>".getBytes());
        MockMultipartFile untyped = new MockMultipartFile("file", "x", null, new byte[]{1});

        assertThrows(IllegalArgumentException.class, () -> service.toDataUrl(svg));
        assertThrows(IllegalArgumentException.class, () -> service.toDataUrl(html));
        assertThrows(IllegalArgumentException.class, () -> service.toDataUrl(untyped));
    }

    @Test
    void anImageOverHalfAMegabyteIsRefused() {
        MockMultipartFile big = new MockMultipartFile("file", "big.jpg", "image/jpeg", new byte[513 * 1024]);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> service.toDataUrl(big));
        assertTrue(error.getMessage().contains("too large"));
    }
}
