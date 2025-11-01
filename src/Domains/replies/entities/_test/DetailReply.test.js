const DetailReply = require('../DetailReply');

describe('DetailReply entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: new Date(),
      username: 'dicoding',
      // is_delete is missing
    };

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123, // should be string
      content: 'sebuah balasan',
      date: new Date(),
      username: 'dicoding',
      is_delete: false,
    };

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailReply entities correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: new Date(),
      username: 'dicoding',
      is_delete: false,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply).toBeInstanceOf(DetailReply);
    expect(detailReply.id).toEqual(payload.id);
    expect(detailReply.content).toEqual(payload.content);
    expect(detailReply.date).toEqual(payload.date);
    expect(detailReply.username).toEqual(payload.username);
  });

  it('should create DetailReply entities correctly when reply is deleted', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: new Date(),
      username: 'dicoding',
      is_delete: true,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply).toBeInstanceOf(DetailReply);
    expect(detailReply.id).toEqual(payload.id);
    expect(detailReply.content).toEqual('**balasan telah dihapus**');
    expect(detailReply.date).toEqual(payload.date);
    expect(detailReply.username).toEqual(payload.username);
  });
});