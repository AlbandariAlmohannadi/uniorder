module.exports = (sequelize, DataTypes) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Must be a valid URL'
        }
      }
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Preparation time in minutes'
    },
    ingredients: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Ingredients must be an array');
          }
        }
      }
    },
    allergens: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Allergens must be an array');
          }
        }
      }
    },
    nutritional_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (typeof value !== 'object') {
            throw new Error('Nutritional info must be a valid JSON object');
          }
        }
      }
    }
  }, {
    tableName: 'menu_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['is_available']
      },
      {
        fields: ['name']
      },
      {
        fields: ['price']
      }
    ],
    scopes: {
      available: {
        where: { is_available: true }
      },
      byCategory: (category) => ({
        where: { category }
      })
    }
  });

  MenuItem.associate = (models) => {
    // MenuItem can be referenced in orders (through order_items JSONB)
    // No direct foreign key relationship due to JSONB structure
  };

  return MenuItem;
};