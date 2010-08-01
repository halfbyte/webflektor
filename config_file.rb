class ConfigFile
  BYTE_ORDER_BIG_ENDIAN = 1
  BYTE_ORDER_LITTLE_ENDIAN = 2

  attr_reader :data
  def initialize(level_file)
    @data = {}
    @version = 0
    @file = File.open(level_file, 'r')
    version_string = @file.readline
    if matchgroup = version_string.match(/_LEVEL_FILE_VERSION_(\d+\.\d+)/)
      
      @version = matchgroup[1].to_f
      puts "Loading File version %f" % @version
    end
    while read_chunk() do
    end
    @file.close
  end
  
  def read_chunk
    chunk_name = @file.read(4)
    return false if chunk_name.nil?
    chunk_length = read32bit(BYTE_ORDER_BIG_ENDIAN)
    send("read_chunk_#{chunk_name.downcase}".to_sym, chunk_length)
  end
  
  def read_chunk_head(length)
    @data[:field_x] = @file.getc
    @data[:field_y] = @file.getc
    @data[:time] = read16bit()
    @data[:kettles_needed] = read16bit()
    @data[:name] = readString(32)
    @data[:score_elements] = []
    16.times do |i|
      @data[:score_elements] << @file.getc
    end
    @data[:auto_count_kettles] = (@file.getc == 1)
    @data[:amoeba_speed] = @file.getc
    @data[:time_fuse] = @file.getc
    laser_color = @file.getc
    @data[:laser_red] = (laser_color >> 2) & 0x01
    @data[:laser_green] = (laser_color >> 1) & 0x01
    @data[:laser_blue] = (laser_color >> 0) & 0x01
    @data[:encoding_16bit_field] = (@file.getc == 1)
    @file.read(19)
  end

  def read_chunk_body(length)
    chunk_size_expected = @data[:field_x] * @data[:field_y]
    if @data[:encoding_16bit_field] && @version >= 2.0
      chunk_size_expected *= 2
    end
    @data[:field] = []
    @data[:field_y].times do |y|
      @data[:field] << []
      @data[:field_x].times do |x|
        @data[:field][y] << check_level_element(@data[:encoding_16bit_field] ? read16bit : @file.getc)
      end
    end    
  end

  def check_level_element(element)
    if element > 500
      return {:non_realtime , 100}
    end
    transform_element(element)
  end
  
  def transform_element(element)
    
    case(element)
    when 240...256; [:mirror, element - 240]
    when 256...264; [:grid_wood , element - 256]
    when 264...272; [:grid_steel , element - 264]
    when 272...288; [:wall_wood , element - 272]
    when 288...304; [:wall_steel , element - 288]
    when 304;       [:empty , 0]
    when 305;       [:cell , 0]
    when 306;       [:mine , 0]
    when 307;       [:refractor , 0]
    when 308...312; [:lazer , element - 308]
    when 312...316; [:detector , element - 312]
    when 316...324; [:fiberoptics , element - 316]
    when 324...340; [:mirror_auto , element - 324]
    when 340...348; [:grid_wood_auto , element - 340]
    when 348...356; [:grid_steel_auto , element - 348]      
    when 0; nil
    else
      {:unknown , element}
    end    
  end
  
  def readString(len)
    @file.read(32).strip
  end
  
  def read16bit(byte_order = BYTE_ORDER_BIG_ENDIAN)
    if (byte_order == BYTE_ORDER_BIG_ENDIAN)
      ((@file.getc <<  8) | (@file.getc <<  0))    
    else
      ((@file.getc <<  0) | (@file.getc <<  8))
    end
  end
  
  def read32bit(byte_order)
    if (byte_order == BYTE_ORDER_BIG_ENDIAN)
      ((@file.getc << 24) | (@file.getc << 16) | (@file.getc <<  8) | (@file.getc <<  0))    
    else
      ((@file.getc <<  0) | (@file.getc <<  8) | (@file.getc << 16) | (@file.getc << 24))
    end
  end
  
  
end