describe('Sanity & Environment Verification', () => {
  it('loads test environment correctly', () => {
    expect(true).toBe(true);
  });

  it('verifies AsyncStorage mock is active', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('test_key', 'test_val');
    const val = await AsyncStorage.getItem('test_key');
    expect(val).toBe('test_val');
  });
});
