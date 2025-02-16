from django.test import TestCase

class BasicTest(TestCase):
    def test_sample(self):
        self.assertEqual(1 + 1, 2) 
