/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createTable('user_comment_likes', {
      id: {
        type: 'VARCHAR(50)',
        primaryKey: true,
      },
      user_id: {
        type: 'VARCHAR(50)',
        notNull: true,
        references: 'users',
        onDelete: 'CASCADE',
      },
      comment_id: {
        type: 'VARCHAR(50)',
        notNull: true,
        references: 'comments',
        onDelete: 'CASCADE',
      },
    });
  
    pgm.addConstraint('user_comment_likes', 'unique_user_id_and_comment_id', 'UNIQUE(user_id, comment_id)');
  };
  
  exports.down = (pgm) => {
    pgm.dropTable('user_comment_likes');
  };