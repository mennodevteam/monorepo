import { Address } from './address';

describe('Address', () => {
  describe('format', () => {
    it('should return empty string for null or undefined', () => {
      expect(Address.format(null)).toBe('');
      expect(Address.format(undefined)).toBe('');
    });

    it('should format description only', () => {
      const address = { description: 'خیابان ولیعصر، بالاتر از میدان ونک' } as unknown as Address;
      expect(Address.format(address)).toBe('خیابان ولیعصر، بالاتر از میدان ونک');
    });

    it('should format description with unit (pelak) and ring (vahed)', () => {
      const address = {
        description: 'خیابان ولیعصر، بالاتر از میدان ونک',
        unit: '12',
        ring: '4',
      } as unknown as Address;
      expect(Address.format(address)).toBe(
        'خیابان ولیعصر، بالاتر از میدان ونک - پلاک 12 - واحد 4'
      );
    });

    it('should not duplicate pelak or vahed prefix if already present', () => {
      const address = {
        description: 'خیابان شریعتی',
        unit: 'پلاک 25',
        ring: 'واحد 2',
      } as unknown as Address;
      expect(Address.format(address)).toBe('خیابان شریعتی - پلاک 25 - واحد 2');
    });

    it('should include region and postal code when present', () => {
      const address = {
        region: { id: 1, title: 'تهران', state: 'تهران' },
        description: 'خیابان انقلاب',
        unit: '100',
        ring: '5',
        postalCode: '1234567890',
      } as unknown as Address;
      expect(Address.format(address)).toBe(
        'تهران - خیابان انقلاب - پلاک 100 - واحد 5 - کدپستی: 1234567890'
      );
    });

    it('should include both state and title if different', () => {
      const address = {
        region: { id: 2, title: 'کرج', state: 'البرز' },
        description: 'بلوار شهرداری',
        unit: '8',
      } as unknown as Address;
      expect(Address.format(address)).toBe('البرز، کرج - بلوار شهرداری - پلاک 8');
    });
  });
});
